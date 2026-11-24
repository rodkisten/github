import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, lstatSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const specs = (process.env.ROD_PATHSPECS ?? '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
if (!specs.length) throw new Error('At least one Git pathspec is required');
const git = args => execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);
const paths = [...new Set([
  ...git(['diff', '--no-renames', '--name-only', '-z', 'HEAD', '--', ...specs]),
  ...git(['ls-files', '--others', '--exclude-standard', '-z', '--', ...specs]),
])].sort();
const files = paths.map(path => {
  if (!lstatSync(path).isFile()) throw new Error('Only regular files are supported: ' + path);
  return { path, content: readFileSync(path).toString('base64'), encoding: 'base64' };
});
const dir = mkdtempSync(join(process.env.RUNNER_TEMP, 'rod-changes-'));
const output = join(dir, 'changes.json');
writeFileSync(output, JSON.stringify(files), { mode: 0o600 });
appendFileSync(process.env.GITHUB_OUTPUT, 'changed=' + Boolean(files.length) + '\ncount=' + files.length + '\nfiles-path=' + output + '\n');
console.log('Collected ' + files.length + ' changed file(s)');
