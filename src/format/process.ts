import { spawnSync } from 'node:child_process';
export type ProcessResult = { ok: boolean; stdout: string; stderr: string; missing: boolean; code: number | null };
export function execute(program: string, args: string[]): ProcessResult {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { ok: result.status === 0 && !result.error, stdout: result.stdout ?? '', stderr: result.stderr ?? result.error?.message ?? '', missing: (result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT', code: result.status };
}
