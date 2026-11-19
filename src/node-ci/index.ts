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
  let failure: Error | undefined;
  const skipped: string[] = [];
  for (const task of tasks) {
    if (!task.enabled) { skipped.push(task.name); continue; }
    if (!task.command.trim()) { failure = new Error(`Missing ${task.name} command`); break; }
    core.startGroup(`🟦 ${task.name}: ${task.command}`);
    try {
      const result = await execute(task.command, cwd);
      results.push({ name: task.name, ...result });
      if (result.exitCode !== 0) {
        failure = new Error(`${task.name} exited with code ${result.exitCode}`);
        break;
      }
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
      break;
    } finally { core.endGroup(); }
  }
  await core.summary.addHeading('🟦 Shared Node CI')
    .addTable([
      [{ data: 'Task', header: true }, { data: 'Exit', header: true }, { data: 'Duration (ms)', header: true }],
      ...results.map(r => [r.name, String(r.exitCode), String(r.durationMs)]),
    ])
    .addRaw(`Skipped: ${skipped.join(', ') || 'none'}\\n\\nStatus: **${failure ? 'failed' : 'passed'}**\\n`)
    .write();
  if (failure) throw failure;
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
