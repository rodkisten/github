import * as core from '@actions/core';
import { runAction } from '../utils/action.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { runCommand } from './run-command.js';

runAction('Shell Command', async () => {
  const inputs = getInputs({
    command: { required: true },
    shell: { default: '/bin/bash' },
    title: { default: 'Shell command' },
  });

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

  setOutputs({
    'exit-code': result.exitCode,
    'duration-ms': result.durationMs,
  });

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
});
