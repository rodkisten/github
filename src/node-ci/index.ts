import { resolve } from 'node:path';
import { runAction } from '../utils/action.js';
import { execute, type CommandResult } from './runner.js';
import { getTasks } from './tasks.js';

runAction('TypeScript Node CI', async ({ utils, logger, style, summary }) => {
  const { getInputs } = utils;
  const inputs = getInputs({
    'working-directory': { default: '.' },
    scope: { default: '' },
    'test-command': { default: 'npm test' },
    'build-command': { default: 'npm run build' },
    'lint-command': { default: 'npm run lint' },
    'run-tests': { type: 'boolean', default: true },
    'run-build': { type: 'boolean', default: true },
    'run-lint': { type: 'boolean', default: false },
  });

  const cwd = resolve(inputs['working-directory']);
  const scope = inputs.scope;
  const commandEnv = { ...process.env, ...(scope ? { ROD_CI_FILTER: scope } : {}) };

  logger.banner(
    'TypeScript Node CI',
    `${scope ? `Filter: ${scope} · ` : ''}${inputs['working-directory']}`
  );

  const tasks = getTasks(
    (name) => String((inputs as Record<string, unknown>)[name] ?? ''),
    (name) => Boolean((inputs as Record<string, unknown>)[name])
  );

  const results: Array<{ name: string } & CommandResult> = [];
  let failure: Error | undefined;
  const skipped: string[] = [];

  for (const task of tasks) {
    if (!task.enabled) {
      skipped.push(task.name);
      logger.debug(`Skipping disabled task: ${task.name}`);
      continue;
    }

    if (!task.command.trim()) {
      failure = new Error(`Missing ${task.name} command`);
      break;
    }

    try {
      await logger.step(`${task.name.toUpperCase()}: ${task.command}`, async () => {
        logger.item('Working directory', cwd);
        if (scope) logger.item('Filter scope', scope);
        const execRes = await execute(task.command, cwd, undefined, commandEnv);
        logger.item('Exit code', execRes.exitCode);
        logger.item('Duration', `${execRes.durationMs}ms`, true);
        results.push({ name: task.name, ...execRes });
        if (execRes.exitCode !== 0) {
          throw new Error(`${task.name} exited with code ${execRes.exitCode}`);
        }
      });
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
      break;
    }
  }

  await summary.publish('🟦 Shared Node CI', [
    {
      table: results.map((r) => ({
        Task: r.name,
        Exit: r.exitCode,
        'Duration (ms)': r.durationMs,
      })),
    },
    {
      text: `Skipped: ${skipped.join(', ') || 'none'}\n\nStatus: **${failure ? 'failed' : 'passed'}**`,
    },
  ]);

  if (failure) {
    throw failure;
  }

  logger.success(`All enabled CI tasks passed in ${style.bold(inputs['working-directory'])}`);
  logger.divider('', '═');
});
