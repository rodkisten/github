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
  try {
    const res = await cmd(program, args).nothrow();
    const missing = res.exitCode === 127 || /not found/i.test(res.stderr);

    if (missing) {
      logger.debug(`Executable "${program}" not found`);
    }

    return {
      ok: res.exitCode === 0,
      stdout: res.stdout,
      stderr: res.stderr,
      missing,
      code: res.exitCode,
    };
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT';
    const message = error instanceof Error ? error.message : String(error);

    if (missing) {
      logger.debug(`Executable "${program}" not found (ENOENT)`);
    }

    return {
      ok: false,
      stdout: '',
      stderr: message,
      missing,
      code: null,
    };
  }
}
