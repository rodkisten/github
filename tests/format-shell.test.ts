import { describe, expect, it } from 'vitest';
import { shellDialect, shellTools } from '../src/format/shell.js';
import type { ProcessResult } from '../src/format/process.js';

const ok: ProcessResult = { ok: true, stdout: '', stderr: '', missing: false, code: 0 };
describe('shell dialect detection and validation', () => {
  it('recognizes zsh startup files', () => expect(shellDialect('.zshrc')).toBe('zsh'));
  it('recognizes bash and POSIX file extensions', () => {
    expect(shellDialect('install.bash')).toBe('bash');
    expect(shellDialect('install.sh')).toBe('posix');
  });
  it('does not send zsh to shfmt or shellcheck', async () => {
    const calls: string[] = [];
    const issues = await shellTools('.zshrc', 'fix', true, (program) => { calls.push(program); return ok; });
    expect(calls).toEqual(['zsh']);
    expect(issues[0]?.status).toBe('ok');
  });
  it('runs formatter and shellcheck for bash', async () => {
    const calls: string[] = [];
    await shellTools('script.bash', 'check', true, (program) => { calls.push(program); return ok; });
    expect(calls).toEqual(['shfmt', 'shellcheck', 'bash']);
  });
  it('reports missing tools instead of silently passing', async () => {
    const issues = await shellTools('script.sh', 'check', false, () => ({ ...ok, ok: false, missing: true }));
    expect(issues[0]?.status).toBe('skipped');
  });
});
