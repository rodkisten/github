import { cmd, type CommandResult } from '../utils/cmd.js';

export type { CommandResult };

const DEFAULT_SHELL = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

export async function execute(
  command: string,
  cwd: string = process.cwd(),
  shell: string = DEFAULT_SHELL,
  env: NodeJS.ProcessEnv = process.env,
): Promise<CommandResult> {
  const { exitCode, durationMs } = await cmd(command, {
    cwd,
    shell,
    env,
    stdio: 'inherit',
    rejectOnNonZero: false,
  });

  return { command, exitCode, durationMs };
}
