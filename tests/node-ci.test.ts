import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execute } from '../src/node-ci/runner.js';

describe('TypeScript Node CI runner', () => {
  it('executes a successful command and reports timing', async () => {
    const result = await execute('node -e "process.exit(0)"', process.cwd());
    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
  it('returns nonzero for a missing executable', async () => {
    const result = await execute('nonexistent-rod-command-12345', process.cwd());
    expect(result.exitCode).not.toBe(0);
  });
  it('preserves failing exit codes', async () => {
    const result = await execute('node -e "process.exit(7)"', process.cwd());
    expect(result.exitCode).toBe(7);
  });
  it('passes the matched filter scope to child processes', async () => {
    const result = await execute("node -e \"process.exit(process.env.ROD_CI_FILTER === 'runtime' ? 0 : 3)\"", process.cwd(), undefined, { ...process.env, ROD_CI_FILTER: 'runtime' });
    expect(result.exitCode).toBe(0);
  });
  it('runs from the requested working directory', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'rod-node-ci-'));
    try {
      const result = await execute('node -e "process.exit(process.cwd() === process.env.EXPECTED_CWD ? 0 : 2)"', cwd, undefined, { ...process.env, EXPECTED_CWD: cwd });
      expect(result.exitCode).toBe(0);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
});
