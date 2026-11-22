import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import * as core from '@actions/core';
import { runAction } from '../utils/action.js';
import { gitSync, listChangedFiles, listTrackedFiles } from '../utils/git.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { execute } from './process.js';
import { shellDialect, shellTools } from './shell.js';

export type Mode = 'check' | 'fix';
export type Scope = 'changed' | 'all';
export type FormatResult = {
  language: string;
  tool: string;
  files: number;
  status: 'ok' | 'failed' | 'skipped';
  detail?: string;
};

const groups: Record<string, string[]> = {
  prettier: [
    '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts',
    '.json', '.jsonc', '.yaml', '.yml', '.css', '.scss', '.less',
    '.html', '.vue', '.md', '.mdx', '.graphql', '.gql', '.svelte', '.astro',
  ],
  go: ['.go'],
  rust: ['.rs'],
  python: ['.py'],
  shell: ['.sh', '.bash', '.zsh'],
};

export function listFiles(scope: Scope, base: string): string[] {
  return scope === 'all' ? listTrackedFiles() : listChangedFiles(base);
}

export function classify(file: string): string | undefined {
  const extension = extname(file).toLowerCase();
  return shellDialect(file)
    ? 'shell'
    : Object.entries(groups).find(([, extensions]) => extensions.includes(extension))?.[0];
}

async function runTool(
  tool: string,
  args: string[]
): Promise<{ ok: boolean; detail?: string; missing: boolean }> {
  const result = await execute(tool, args);
  return {
    ok: result.ok,
    detail: (result.stderr || result.stdout).slice(-2500),
    missing: result.missing,
  };
}

export async function formatFiles(
  files: string[],
  mode: Mode,
  lint: boolean
): Promise<FormatResult[]> {
  const results: FormatResult[] = [];

  for (const language of Object.keys(groups)) {
    const selected = files.filter((file) => classify(file) === language);
    if (!selected.length) continue;

    if (language === 'shell') {
      for (const file of selected) {
        for (const issue of await shellTools(file, mode, lint)) {
          results.push({
            language: issue.dialect,
            tool: issue.tool,
            files: 1,
            status: issue.status,
            detail: issue.detail,
          });
        }
      }
    } else if (language === 'prettier') {
      const prettier = 'node_modules/.bin/prettier';
      if (!existsSync(prettier)) {
        logger.debug('Prettier binary not found in node_modules/.bin/prettier, skipping');
        results.push({
          language,
          tool: 'prettier',
          files: selected.length,
          status: 'skipped',
          detail: 'Install repository dependencies first',
        });
        continue;
      }

      const check = await runTool(prettier, [
        mode === 'fix' ? '--write' : '--check',
        '--ignore-unknown',
        ...selected,
      ]);
      results.push({
        language,
        tool: 'prettier',
        files: selected.length,
        status: check.ok ? 'ok' : 'failed',
        detail: check.ok ? undefined : check.detail,
      });

      if (lint) {
        const eslint = 'node_modules/.bin/eslint';
        const js = selected.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
        if (js.length && existsSync(eslint)) {
          const checked = await runTool(eslint, [
            ...(mode === 'fix' ? ['--fix'] : []),
            ...js,
          ]);
          results.push({
            language: 'javascript',
            tool: 'eslint',
            files: js.length,
            status: checked.ok ? 'ok' : 'failed',
            detail: checked.ok ? undefined : checked.detail,
          });
        }
      }
    } else {
      const toolMap: Record<string, string> = {
        go: 'gofmt',
        rust: 'rustfmt',
        python: 'ruff',
      };
      const tool = toolMap[language]!;
      const args =
        language === 'go'
          ? mode === 'fix'
            ? ['-w', ...selected]
            : ['-l', ...selected]
          : language === 'rust'
            ? mode === 'fix'
              ? ['--emit', 'files', ...selected]
              : ['--check', ...selected]
            : language === 'python'
              ? mode === 'fix'
                ? ['format', ...selected]
                : ['format', '--check', ...selected]
              : [];

      const checked = await runTool(tool, args);
      const ok = checked.ok && !(language === 'go' && mode === 'check' && checked.detail?.trim());
      results.push({
        language,
        tool,
        files: selected.length,
        status: checked.missing ? 'skipped' : ok ? 'ok' : 'failed',
        detail: ok ? undefined : checked.detail,
      });
    }
  }

  return results;
}

export async function runFormatAction(): Promise<void> {
  const inputs = getInputs({
    mode: { default: 'check' },
    scope: { default: 'changed' },
    base: { default: 'origin/main' },
    lint: { type: 'boolean', default: true },
    'results-file': { default: '' },
    'commit-files-path': { default: '' },
  });

  const mode: Mode = inputs.mode === 'fix' ? 'fix' : 'check';
  const scope: Scope = inputs.scope === 'all' ? 'all' : 'changed';
  const base = inputs.base;

  logger.banner('Rod Universal Format', `${mode.toUpperCase()} · ${scope}`);

  const files = await logger.step('Discover target files', () => {
    const discovered = listFiles(scope, base);
    logger.item('Scope', scope);
    logger.item('Base ref', base);
    logger.item('Files found', discovered.length, true);
    return discovered;
  });

  const results = await logger.step(`Format & lint (${files.length} file(s))`, async () => {
    const res = await logger.spin(
      `Executing formatters & linters (${mode})`,
      () => formatFiles(files, mode, inputs.lint)
    );
    for (const r of res) {
      logger.item(`${r.tool} (${r.language})`, `${r.status} · ${r.files} file(s)`);
    }
    return res;
  });

  const changed = mode === 'fix' ? gitSync(['diff', '--name-only']).split('\n').filter(Boolean) : [];
  const failed = results.filter((result) => result.status === 'failed');
  const skipped = results.filter((result) => result.status === 'skipped');
  const suggestedCommit = `style(format): normalize ${changed.length || files.length} files [skip ci]`;

  if (inputs['commit-files-path']) {
    writeFileSync(
      inputs['commit-files-path'],
      JSON.stringify(changed.map((path) => ({ path, content: readFileSync(path, 'utf8') })))
    );
    logger.item('Commit payload written to', inputs['commit-files-path']);
  }

  if (inputs['results-file']) {
    writeFileSync(inputs['results-file'], JSON.stringify(results, null, 2));
    logger.item('Results JSON written to', inputs['results-file'], true);
  }

  setOutputs({
    'changed-files': changed,
    'result-json': results,
    'suggested-commit': suggestedCommit,
  });

  await summary.publish(`🎨 Rod Format · ${mode.toUpperCase()}`, [
    {
      table: results.map((r) => ({
        Tool: r.tool,
        Language: r.language,
        Files: r.files,
        Result: r.status === 'ok' ? '✅ ok' : r.status === 'failed' ? '❌ failed' : '⚠️ skipped',
      })),
    },
    {
      text: `**Scope:** ${scope} · **Selected:** ${files.length} · **Changed:** ${changed.length}\n\nSuggested commit: \`${suggestedCommit}\``,
    },
    ...failed.map((r) => ({
      details: {
        summary: `❌ ${r.tool} diagnostics`,
        content: r.detail || 'Failed',
        codeLang: 'text',
      },
    })),
    ...skipped.map((r) => ({
      text: `⚠️ **${r.tool}:** ${r.detail || 'Unavailable'}`,
    })),
  ]);

  if (failed.length > 0) {
    throw new Error(`${failed.length} formatting/lint check(s) failed`);
  }

  logger.success(
    `Format check completed (${style.bold(`${changed.length} file(s) modified`)})`
  );
  logger.divider('', '═');
}

runAction('Rod Universal Format', runFormatAction);
