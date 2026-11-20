import * as core from '@actions/core';
import { appendFile } from 'node:fs/promises';
import { runCommand } from './run-command.js';


async function main(): Promise<void> {
  const command = core.getInput('command', { required: true });
  const shell = core.getInput('shell') || '/bin/bash';
  const title = core.getInput('title') || 'Shell command';
  core.info('▶ ' + title);
  const result = await runCommand(command, shell);
  core.setOutput('exit-code', String(result.exitCode));
  core.setOutput('duration-ms', String(result.durationMs));
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) await appendFile(summary, ['### ' + title, '', '- Exit: ' + result.exitCode, '- Duration: ' + result.durationMs + ' ms', ''].join('\n'));
  if (result.exitCode !== 0) core.setFailed(title + ' failed with exit code ' + result.exitCode);
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
