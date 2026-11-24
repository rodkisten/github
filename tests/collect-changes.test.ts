import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const script = resolve('scripts/collect-changes.mjs');
let root: string;
let repo: string;
let output: string;
const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'pipe' });
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'rod-collect-test-'));
  repo = join(root, 'repo');
  output = join(root, 'outputs');
  mkdirSync(repo);
  git('init');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.invalid');
  writeFileSync(join(repo, 'tracked.txt'), 'original');
  git('add', '.');
  git('commit', '-m', 'fixture');
  writeFileSync(output, '');
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
function collect(specs: string) {
  return spawnSync(process.execPath, [script], {
    cwd: repo, encoding: 'utf8',
    env: { ...process.env, ROD_PATHSPECS: specs, RUNNER_TEMP: root, GITHUB_OUTPUT: output },
  });
}
function payload() {
  const outputs = Object.fromEntries(readFileSync(output, 'utf8').trim().split('\n').map(line => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1)];
  }));
  return { outputs, files: JSON.parse(readFileSync(outputs['files-path'], 'utf8')) };
}
describe('collect-changes', () => {
  it('returns an empty payload for a clean repository', () => {
    expect(collect('tracked.txt').status).toBe(0);
    expect(payload().outputs.changed).toBe('false');
    expect(payload().files).toEqual([]);
  });
  it('collects staged, unstaged and untracked files once, preserving binary content', () => {
    writeFileSync(join(repo, 'tracked.txt'), 'staged');
    git('add', 'tracked.txt');
    writeFileSync(join(repo, 'tracked.txt'), 'final');
    writeFileSync(join(repo, 'new file.bin'), Buffer.from([0, 255, 42]));
    writeFileSync(join(repo, 'excluded.log'), 'ignore');
    expect(collect('tracked.txt\n:(glob)*.bin\ntracked.txt').status).toBe(0);
    expect(payload().outputs.count).toBe('2');
    expect(payload().files).toEqual([
      { path: 'new file.bin', content: 'AP8q', encoding: 'base64' },
      { path: 'tracked.txt', content: Buffer.from('final').toString('base64'), encoding: 'base64' },
    ]);
  });
  it('rejects deleted files rather than silently losing changes', () => {
    rmSync(join(repo, 'tracked.txt'));
    expect(collect('tracked.txt').status).not.toBe(0);
    expect(readFileSync(output, 'utf8')).toBe('');
  });
  it('rejects missing pathspecs', () => {
    expect(collect('  ').status).not.toBe(0);
  });
});
