import * as core from '@actions/core';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { runCommand } from './run-command.js';

interface ShellActionInputs {
  command: string;
  shell: string;
  title: string;
}

function getInputs(): ShellActionInputs {
  return {
    command: core.getInput('command', { required: true }),
    shell: core.getInput('shell') || '/bin/bash',
    title: core.getInput('title') || 'Shell command',
  };
}

async function main(): Promise<void> {
  const inputs = getInputs();

  logger.banner(inputs.title, `Shell: ${inputs.shell}`);

  const result = await logger.step(inputs.title, async () => {
    logger.item('Shell', inputs.shell);
    logger.item('Command', style.cyan(inputs.command), true);

    const execResult = await runCommand(inputs.command, inputs.shell);

    logger.item('Exit code', execResult.exitCode);
    logger.item('Duration', `${execResult.durationMs}ms`, true);

    return execResult;
  });

  logger.divider('Outputs & Summary');

  core.setOutput('exit-code', String(result.exitCode));
  core.setOutput('duration-ms', String(result.durationMs));

  await summary
    .heading(inputs.title, 3)
    .kv({
      Status: result.exitCode === 0 ? '✅ Success' : `❌ Failed (${result.exitCode})`,
      'Exit code': result.exitCode,
      Duration: `${result.durationMs} ms`,
    })
    .write();

  if (result.exitCode !== 0) {
    const failMessage = `${inputs.title} failed with exit code ${result.exitCode}`;
    logger.error(failMessage, inputs.title);
    core.setFailed(failMessage);
    return;
  }

  logger.success(`${inputs.title} completed in ${style.bold(`${result.durationMs}ms`)}`);
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'Shell Command');
  core.setFailed(message);
});
