import { spawn } from 'node:child_process';

export type CommandResult = { command: string; exitCode: number; durationMs: number };

export async function execute(
  command: string,
  cwd: string,
  shell: string = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
  env: NodeJS.ProcessEnv = process.env,
): Promise<CommandResult> {
  const started = Date.now();
  const child = spawn(command, { cwd, shell, stdio: 'inherit', env });
  const exitCode = await new Promise<number>((done, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) =>
      signal ? reject(new Error(`Command terminated by ${signal}`)) : done(code ?? 1),
    );
  });
  return { command, exitCode, durationMs: Date.now() - started };
}
