import { cmd } from '../utils/cmd.js';
import { logger } from '../utils/logger.js';

export interface ProcessResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  missing: boolean;
  code: number | null;
}

export async function execute(program: string, args: string[]): Promise<ProcessResult> {
  const res = await cmd(program, args).nothrow();

  if (res.missing) {
    logger.debug(`Executable "${program}" not found`);
  }

  return {
    ok: res.exitCode === 0,
    stdout: res.stdout,
    stderr: res.stderr,
    missing: res.missing,
    code: res.exitCode,
  };
}
