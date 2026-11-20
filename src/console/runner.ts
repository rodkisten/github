import * as core from '@actions/core';
import { spawn } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

export function runCommand(command: string, shell: string, env: NodeJS.ProcessEnv = process.env): Promise<{ exitCode: number; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(shell, ['-eo', 'pipefail', '-c', command], { stdio: 'inherit', env });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - started);
      if (signal) return reject(new Error('Command terminated by signal ' + signal));
      resolve({ exitCode: code ?? 1, durationMs });
    });
  });
}

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
