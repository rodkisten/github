import { readFile, writeFile } from 'node:fs/promises';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { formatFiles, listFiles, type Mode, type Scope } from '../format/index.js';
import { runAction } from '../utils/action.js';
import { gitSync } from '../utils/git.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { resolveConfig } from './config.js';
import { selectEvents } from './events.js';

interface ConsoleInputs {
  defaultsPath: string;
  overridePath: string;
  formatMode: string;
  formatScope: Scope;
  formatBase: string;
  formatLint: boolean;
  commitFilesPath: string;
  resultsFile: string;
  report: boolean;
  githubToken: string;
  eventsFile: string;
}

function parseConsoleInputs(): ConsoleInputs {
  const parsed = getInputs({
    defaults: { required: true },
    config: { default: '.github/rod-actions.yml' },
    'format-mode': { default: 'off' },
    'format-scope': { default: 'changed' },
    'format-base': { default: 'origin/main' },
    'format-lint': { type: 'boolean', default: true },
    'commit-files-path': { default: '' },
    'results-file': { default: '' },
    report: { type: 'boolean', default: false },
    'github-token': { default: '', secret: true },
    'events-file': { default: '' },
  });

  return {
    defaultsPath: parsed.defaults,
    overridePath: parsed.config,
    formatMode: parsed['format-mode'],
    formatScope: parsed['format-scope'] === 'all' ? 'all' : 'changed',
    formatBase: parsed['format-base'],
    formatLint: parsed['format-lint'],
    commitFilesPath: parsed['commit-files-path'],
    resultsFile: parsed['results-file'],
    report: parsed.report,
    githubToken: parsed['github-token'],
    eventsFile: parsed['events-file'],
  };
}

async function loadOptionalFile(filePath: string): Promise<string | undefined> {
  if (!filePath) return undefined;

  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.debug(`Optional config file not found at "${filePath}", skipping.`);
      return undefined;
    }
    throw error;
  }
}

async function runFormatStep(inputs: ConsoleInputs): Promise<void> {
  if (!inputs.formatMode || inputs.formatMode === 'off') {
    setOutputs({
      'format-changed-files': [],
      'format-results': [],
      'suggested-commit': '',
    });
    return;
  }

  await logger.step(`Run formatter (${inputs.formatMode})`, async () => {
    const mode: Mode = inputs.formatMode === 'fix' ? 'fix' : 'check';
    logger.item('Scope', inputs.formatScope);
    logger.item('Base ref', inputs.formatBase);

    const targetFiles = listFiles(inputs.formatScope, inputs.formatBase);
    logger.item('Target files', targetFiles.length, true);

    const results = await logger.spin(
      `Executing format/lint on ${targetFiles.length} file(s)`,
      () => formatFiles(targetFiles, mode, inputs.formatLint)
    );

    const changed =
      mode === 'fix' ? gitSync(['diff', '--name-only']).split('\n').filter(Boolean) : [];
    const suggestedCommit = `style(format): normalize ${changed.length || targetFiles.length} files [skip ci]`;

    if (inputs.commitFilesPath) {
      const payload = await Promise.all(
        changed.map(async (path) => ({ path, content: await readFile(path, 'utf8') }))
      );
      await writeFile(inputs.commitFilesPath, JSON.stringify(payload));
      logger.item('Commit payload written to', inputs.commitFilesPath);
    }

    if (inputs.resultsFile) {
      await writeFile(inputs.resultsFile, JSON.stringify(results, null, 2));
      logger.item('Format results written to', inputs.resultsFile);
    }

    setOutputs({
      'format-changed-files': changed,
      'format-results': results,
      'suggested-commit': suggestedCommit,
    });

    const hasFailures = results.some((result) => result.status === 'failed');
    if (hasFailures) {
      logger.error('Formatting/lint issues detected');
      core.setFailed('Formatting/lint issues detected');
    } else {
      logger.success(`Formatting/lint passed (${changed.length} file(s) modified)`);
    }
  });
}

async function runReportStep(
  inputs: ConsoleInputs,
  config: ReturnType<typeof resolveConfig>
): Promise<void> {
  if (!inputs.report) {
    logger.debug('Report mode disabled, skipping workflow run inspection.');
    return;
  }

  if (!inputs.githubToken) {
    throw new Error('github-token required for report mode');
  }

  const { owner, repo } = github.context.repo;
  const runId = github.context.runId;
  const client = github.getOctokit(inputs.githubToken);

  await logger.step('Inspect workflow run & generate report', async () => {
    const jobs = await logger.spin(`Listing jobs for run #${runId}`, () =>
      client.paginate(client.rest.actions.listJobsForWorkflowRun, {
        owner,
        repo,
        run_id: runId,
        per_page: 100,
      })
    );

    const events = selectEvents(config, jobs, `${owner}/${repo}`, runId);
    setOutputs({ 'event-count': events.length });

    logger.item('Workflow jobs inspected', jobs.length);
    logger.item('Notification candidates', events.length, !inputs.eventsFile);

    if (inputs.eventsFile) {
      await writeFile(inputs.eventsFile, `${JSON.stringify(events, null, 2)}\n`);
      logger.item('Events exported to', inputs.eventsFile, true);
    }

    summary
      .heading('🧩 Rod Actions Console')
      .text(`Notification candidates: **${events.length}**`);

    if (events.length > 0) {
      summary.table(
        events.map((event) => ({
          Type: event.type,
          Target: String(event.step ?? event.jobId),
          Conclusion: String(event.conclusion ?? 'unknown'),
        }))
      );
    }

    await summary.write();
  });
}

runAction('Rod Actions Console', async ({ utils, logger, style, octoKit: github }) => {
  const { setOutputs } = utils;
  const { owner, repo } = github.context.repo;

  logger.banner('Rod Actions Console', `${owner}/${repo} · Run #${github.context.runId}`);

  const inputs = parseConsoleInputs();

  const config = await logger.step('Resolve console configuration', async () => {
    const defaults = await readFile(inputs.defaultsPath, 'utf8');
    const override = await loadOptionalFile(inputs.overridePath);
    const resolved = resolveConfig(defaults, override);

    logger.item('Defaults path', inputs.defaultsPath);
    logger.item('Override path', override ? inputs.overridePath : 'none');
    logger.item('Notify enabled', resolved.notify.enabled);
    logger.item('Release mode', resolved.release.mode, true);

    setOutputs({
      'notify-enabled': resolved.notify.enabled,
      'release-mode': resolved.release.mode,
    });

    return resolved;
  });

  await runFormatStep(inputs);
  await runReportStep(inputs, config);

  logger.divider('Status');
  logger.success(`Console execution completed (${style.bold(config.release.mode)})`);
  logger.divider('', '═');
});
