import * as core from '@actions/core';
import * as github from '@actions/github';
import { readFile, appendFile } from 'node:fs/promises';
import { resolveConfig } from './config.js';
import { selectEvents } from './events.js';

async function main(): Promise<void> {
  const defaults = await readFile(core.getInput('defaults', { required: true }), 'utf8');
  const overridePath = core.getInput('config');
  let override: string | undefined;
  if (overridePath) {
    try { override = await readFile(overridePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const config = resolveConfig(defaults, override);
  core.setOutput('notify-enabled', String(config.notify.enabled));
  core.setOutput('release-mode', config.release.mode);
  const report = core.getInput('report') === 'true';
  if (!report) return;
  const token = core.getInput('github-token');
  if (!token) throw new Error('github-token required for report mode');
  const { owner, repo } = github.context.repo;
  const runId = github.context.runId;
  const client = github.getOctokit(token);
  const jobs = await client.paginate(client.rest.actions.listJobsForWorkflowRun, { owner, repo, run_id: runId, per_page: 100 });
  const events = selectEvents(config, jobs, owner + '/' + repo, runId);
  core.setOutput('event-count', String(events.length));
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) await appendFile(summary, ['## 🧩 Rod Actions Console', '', 'Notification candidates: ' + events.length, '', ...events.map(event => '- ' + event.type + ': ' + (event.step ?? event.jobId) + ' (' + event.conclusion + ')'), ''].join('\n'));
  const output = core.getInput('events-file');
  if (output) await (await import('node:fs/promises')).writeFile(output, JSON.stringify(events, null, 2) + '\n');
  // Deliberately no webhook dispatch: transport contract and idempotency must be configured before enabling delivery.
}

main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
