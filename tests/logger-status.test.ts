import { describe, it, expect, vi } from 'vitest';
import { Logger } from '../src/utils/logger.js';

describe('logger step result status', () => {
  it.each([0, 1, 7])('reports the actual status for exit code %i', async (exitCode) => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const result = await new Logger().step('Command', () => ({ exitCode }), {
        isSuccess: value => value.exitCode === 0,
      });
      expect(result.exitCode).toBe(exitCode);
      const output = write.mock.calls.map(call => String(call[0])).join('');
      expect(output).toContain(exitCode === 0 ? ' PASS ' : ' FAIL ');
      expect(output).not.toContain(exitCode === 0 ? ' FAIL ' : ' PASS ');
    } finally {
      write.mockRestore();
    }
  });
});
