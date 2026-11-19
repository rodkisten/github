import * as core from '@actions/core';
import { resolve } from 'node:path';
import { execute, type CommandResult } from './runner.js';

async function main(): Promise<void> {
  const cwd = resolve(core.getInput('working-directory') || '.');
  const tasks = [
    { name: 'test', enabled: core.getBooleanInput('run-tests'), command: core.getInput('test-command') },
    { name: 'build', enabled: core.getBooleanInput('run-build'), command: core.getInput('build-command') },
  ];
  const results: Array<{ name: string } & CommandResult> = [];
  for (const task of tasks) {
    if (!task.enabled) continue;
    if (!task.command.trim()) throw new Error(`Missing ${task.name} command`);
    core.startGroup(`🟦 ${task.name}: ${task.command}`);
    try {
      const result = await execute(task.command, cwd);
      results.push({ name: task.name, ...result });
      if (result.exitCode !== 0) throw new Error(`${task.name} exited with code ${result.exitCode}`);
    } finally { core.endGroup(); }
  }
  await core.summary.addHeading('🟦 Shared Node CI')
    .addTable([
      [{ data: 'Task', header: true }, { data: 'Exit', header: true }, { data: 'Duration (ms)', header: true }],
      ...results.map(r => [r.name, String(r.exitCode), String(r.durationMs)]),
    ]).write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
