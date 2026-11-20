import * as core from '@actions/core';
import { execFileSync } from 'node:child_process';
import { execute } from './process.js';
import { shellDialect, shellTools } from './shell.js';
import { existsSync, appendFileSync, writeFileSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';

type Mode = 'check' | 'fix';
type Scope = 'changed' | 'all';
type Result = { language: string; tool: string; files: number; status: 'ok' | 'failed' | 'skipped'; detail?: string };

const groups: Record<string, string[]> = {
  prettier: ['.js','.jsx','.mjs','.cjs','.ts','.tsx','.mts','.cts','.json','.jsonc','.yaml','.yml','.css','.scss','.less','.html','.vue','.md','.mdx','.graphql','.gql','.svelte','.astro'],
  go: ['.go'],
  rust: ['.rs'],
  python: ['.py'],
  shell: ['.sh','.bash','.zsh'],
};
function git(args: string[]): string { return execFileSync('git', args, { encoding: 'utf8' }).trim(); }
export function listFiles(scope: Scope, base: string): string[] {
  const raw = scope === 'all'
    ? execFileSync('git', ['ls-files','-z'])
    : execFileSync('git', ['diff','--name-only','--diff-filter=ACMR','-z', base + '...HEAD']);
  return [...new Set(raw.toString('utf8').split('\0').filter(Boolean))].filter(existsSync).sort();
}
export function classify(file: string): string | undefined {
  const extension = extname(file).toLowerCase();
  return shellDialect(file) ? 'shell' : Object.entries(groups).find(([, extensions]) => extensions.includes(extension))?.[0];
}
function run(tool: string, args: string[]): { ok: boolean; detail?: string; missing: boolean } {
  const result = execute(tool, args);
  return { ok: result.ok, detail: (result.stderr || result.stdout).slice(-2500), missing: result.missing };
}
export function formatFiles(files: string[], mode: Mode, lint: boolean): Result[] {
  const results: Result[] = [];
  for (const [language, paths] of Object.entries(groups)) {
    const selected = files.filter(file => classify(file) === language);
    if (!selected.length) continue;
    if (language === 'shell') {
      for (const file of selected) for (const issue of shellTools(file, mode, lint)) {
        results.push({ language: issue.dialect, tool: issue.tool, files: 1, status: issue.status, detail: issue.detail });
      }
    } else if (language === 'prettier') {
      const prettier = 'node_modules/.bin/prettier';
      if (!existsSync(prettier)) { results.push({ language, tool: 'prettier', files: selected.length, status: 'skipped', detail: 'Install repository dependencies first' }); continue; }
      const check = run(prettier, [mode === 'fix' ? '--write' : '--check', '--ignore-unknown', ...selected]);
      results.push({ language, tool: 'prettier', files: selected.length, status: check.ok ? 'ok' : 'failed', detail: check.ok ? undefined : check.detail });
      if (lint) {
        const eslint = 'node_modules/.bin/eslint';
        const js = selected.filter(file => /\.[cm]?[jt]sx?$/.test(file));
        if (js.length && existsSync(eslint)) {
          const checked = run(eslint, [...(mode === 'fix' ? ['--fix'] : []), ...js]);
          results.push({ language: 'javascript', tool: 'eslint', files: js.length, status: checked.ok ? 'ok' : 'failed', detail: checked.ok ? undefined : checked.detail });
        }
      }
    } else {
      const tool = { go: 'gofmt', rust: 'rustfmt', python: 'ruff' }[language]!;
      const args = language === 'go' ? (mode === 'fix' ? ['-w', ...selected] : ['-l', ...selected])
        : language === 'rust' ? (mode === 'fix' ? ['--emit','files', ...selected] : ['--check', ...selected])
        : language === 'python' ? (mode === 'fix' ? ['format', ...selected] : ['format','--check', ...selected])
        : [];
      const checked = run(tool, args);
      const ok = checked.ok && !(language === 'go' && mode === 'check' && checked.detail?.trim());
      results.push({ language, tool, files: selected.length, status: checked.missing ? 'skipped' : ok ? 'ok' : 'failed', detail: ok ? undefined : checked.detail });
    }
  }
  return results;
}
async function main(): Promise<void> {
  const mode = core.getInput('mode') === 'fix' ? 'fix' : 'check';
  const scope = core.getInput('scope') === 'all' ? 'all' : 'changed';
  const base = core.getInput('base') || 'origin/main';
  const files = listFiles(scope, base);
  const results = formatFiles(files, mode, core.getInput('lint') !== 'false');
  const changed = mode === 'fix' ? git(['diff','--name-only']).split('\n').filter(Boolean) : [];
  const failed = results.filter(result => result.status === 'failed');
  const skipped = results.filter(result => result.status === 'skipped');
  core.setOutput('changed-files', JSON.stringify(changed));
  core.setOutput('commit-files', JSON.stringify(changed.map(path => ({ path, content: readFileSync(path, 'utf8') }))));
  core.setOutput('result-json', JSON.stringify(results));
  const resultsFile = core.getInput('results-file');
  if (resultsFile) writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  core.setOutput('suggested-commit', 'style(format): normalize ' + (changed.length || files.length) + ' files [skip ci]');
  const summary = ['## 🎨 Rod Format · ' + mode.toUpperCase(), '', '| Tool | Files | Result |', '|---|---:|---|', ...results.map(r => '| '+r.tool+' | '+r.files+' | '+r.status+' |'), '', '**Scope:** '+scope+' · **Selected:** '+files.length+' · **Changed:** '+changed.length, '', 'Suggested commit: `style(format): normalize '+(changed.length || files.length)+' files [skip ci]`', '', ...failed.map(r => '### ❌ '+r.tool+'\n\n```text\n'+(r.detail||'Failed')+'\n```'), ...skipped.map(r => '⚠️ '+r.tool+': '+(r.detail||'Unavailable')), ''].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (failed.length) core.setFailed(failed.length+' formatting/lint checks failed');
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
