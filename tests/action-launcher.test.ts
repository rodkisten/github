import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('same-revision action launcher', () => {
  it('forwards hyphenated inputs and preserves values and exit status', () => {
    const root = mkdtempSync(join(tmpdir(), 'rod-launcher-'));
    try {
      mkdirSync(join(root, 'scripts'));
      mkdirSync(join(root, 'dist'));
      writeFileSync(join(root, 'package.json'), '{"type":"module"}');
      copyFileSync(resolve('scripts/run-action.mjs'), join(root, 'scripts/run-action.mjs'));
      writeFileSync(join(root, 'dist/commit.js'), `
        console.log(JSON.stringify({
          token: process.env.INPUT_TOKEN,
          files: process.env['INPUT_FILES-PATH'],
          message: process.env.INPUT_MESSAGE,
          original: process.env.ROD_INPUT_TOKEN
        }));
        process.exitCode = 7;
      `);
      const result = spawnSync(process.execPath, [join(root, 'scripts/run-action.mjs'), 'commit'], {
        cwd: tmpdir(),
        encoding: 'utf8',
        env: { ...process.env, ROD_INPUT_TOKEN: 'fixture', ROD_INPUT_FILES_PATH: 'a b.json', ROD_INPUT_MESSAGE: 'line 1\\nline 2' }
      });
      expect(result.status).toBe(7);
      expect(JSON.parse(result.stdout)).toEqual({ token: 'fixture', files: 'a b.json', message: 'line 1\\nline 2' });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects unknown bundle names', () => {
    const result = spawnSync(process.execPath, [resolve('scripts/run-action.mjs'), '../unknown'], { encoding: 'utf8' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Unknown action');
  });
});
