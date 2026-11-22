import { readFile, writeFile } from 'node:fs/promises';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { resolveConfig } from './config.js';
import { selectEvents } from './events.js';

interface ConsoleInputs {
  defaultsPath: string;
  overridePath: string;
  formatMode: string;
  formatScope: 'all' | 'changed';
  formatBase: string;
  report: boolean;
  githubToken: string;
  eventsFile: string;
}

function getInputs(): ConsoleInputs {
  const githubToken = core.getInput('github-token');
  if (githubToken) {
    core.setSecret(githubToken);
  }

  return {
    defaultsPath: core.getInput('defaults', { required: true }),
    overridePath: core.getInput('config'),
    formatMode: core.getInput('format-mode'),
    formatScope: core.getInput('format-scope') === 'all' ? 'all' : 'changed',
    formatBase: core.getInput('format-base') || 'origin/main',
    report: core.getInput('report') === 'true',
    githubToken,
    eventsFile: core.getInput('events-file'),
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
    return;
  }

  await logger.step(`Run formatter (${inputs.formatMode})`, async () => {
    const mode = inputs.formatMode === 'fix' ? 'fix' : 'check';
    logger.item('Scope', inputs.formatScope);
    logger.item('Base ref', inputs.formatBase);

    const { listFiles, formatFiles } = await import('../format/index.js');
    const targetFiles = listFiles(inputs.formatScope, inputs.formatBase);
    logger.item('Target files', targetFiles.length, true);

    const results = await logger.spin(
      `Executing format/lint on ${targetFiles.length} file(s)`,
      async () => formatFiles(targetFiles, mode, true)
    );

    core.setOutput('format-results', JSON.stringify(results));

    const hasFailures = results.some((result) => result.status === 'failed');
    if (hasFailures) {
      logger.error('Formatting/lint issues detected');
      core.setFailed('Formatting/lint issues detected');
    } else {
      logger.success('Formatting/lint check passed');
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
    core.setOutput('event-count', String(events.length));

    logger.item('Workflow jobs inspected', jobs.length);
    logger.item('Notification candidates', events.length, !inputs.eventsFile);

    if (inputs.eventsFile) {
      await writeFile(inputs.eventsFile, `${JSON.stringify(events, null, 2)}\n`);
      logger.item('Events exported to', inputs.eventsFile, true);
    }

    summary.heading('🧩 Rod Actions Console').text(`Notification candidates: **${events.length}**`);

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
    // Deliberately no webhook dispatch: transport contract and idempotency must be configured before enabling delivery.
  });
}

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;

  logger.banner('Rod Actions Console', `${owner}/${repo} · Run #${github.context.runId}`);

  const inputs = getInputs();

  const config = await logger.step('Resolve console configuration', async () => {
    const defaults = await readFile(inputs.defaultsPath, 'utf8');
    const override = await loadOptionalFile(inputs.overridePath);
    const resolved = resolveConfig(defaults, override);

    logger.item('Defaults path', inputs.defaultsPath);
    logger.item('Override path', override ? inputs.overridePath : 'none');
    logger.item('Notify enabled', resolved.notify.enabled);
    logger.item('Release mode', resolved.release.mode, true);

    core.setOutput('notify-enabled', String(resolved.notify.enabled));
    core.setOutput('release-mode', resolved.release.mode);

    return resolved;
  });

  await runFormatStep(inputs);
  await runReportStep(inputs, config);

  logger.divider('Status');
  logger.success(`Console execution completed (${style.bold(config.release.mode)})`);
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'Rod Actions Console');
  core.setFailed(message);
});
