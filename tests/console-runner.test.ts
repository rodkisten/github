import { describe, expect, it } from 'vitest';
import { runCommand } from '../src/console/run-command.js';

describe('console command execution', () => {
  it('returns successful exit codes', async () => {
    const result = await runCommand('exit 0', '/bin/bash');
    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
  it('returns failing exit codes without hiding them', async () => {
    expect((await runCommand('exit 7', '/bin/bash')).exitCode).toBe(7);
  });
});
