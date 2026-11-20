import { spawn } from 'node:child_process';
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
