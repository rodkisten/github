import * as core from '@actions/core';
import { appendFile } from 'node:fs/promises';

async function main(): Promise<void> {
  const title = core.getInput('title') || 'CI report';
  const status = core.getInput('status', { required: true });
  const details = core.getInput('details');
  const repository = process.env.GITHUB_REPOSITORY || 'unknown';
  const workflow = process.env.GITHUB_WORKFLOW || 'unknown';
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary) throw new Error('GITHUB_STEP_SUMMARY is not set');
  const safe = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
  const markdown = [
    `## ${title}`,
    '',
    '| Repository | Workflow | Status |',
    '|---|---|---|',
    `| ${safe(repository)} | ${safe(workflow)} | ${safe(status)} |`,
    '',
    details,
    '',
  ].join('\n');
  await appendFile(summary, markdown, 'utf8');
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
