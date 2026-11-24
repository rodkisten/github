import { globSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

for (const path of globSync('.github/workflows/*.yml')) YAML.parse(readFileSync(path, 'utf8'));
for (const path of globSync('src/**/action.yml')) {
  const action = YAML.parse(readFileSync(path, 'utf8'));
  for (const [key, input] of Object.entries(action.inputs ?? {})) {
    if ('value' in input) throw new Error(path + ': unexpected input value: ' + key);
  }
  if (action.runs.using === 'composite') {
    for (const [key, output] of Object.entries(action.outputs ?? {})) {
      if (!output.value) throw new Error(path + ': missing output mapping: ' + key);
    }
    for (const step of action.runs.steps) {
      if (step.run && !step.shell) throw new Error(path + ': missing shell');
      const match = step.uses?.match(/^rodkisten\/github\/(src\/.+)@main$/);
      if (match && !existsSync(match[1] + '/action.yml')) throw new Error(path + ': missing local action ' + match[1]);
    }
  } else if (action.runs.using === 'node24') {
    for (const key of ['main', 'pre', 'post']) {
      if (key !== 'main' && !action.runs[key]) continue;
      const entry = resolve(dirname(path), action.runs[key]);
      if (!existsSync(entry) || !statSync(entry).size) throw new Error(path + ': missing ' + entry);
    }
  }
  console.log('OK', path);
}
for (const path of globSync('dist/**/*.js')) {
  if (spawnSync(process.execPath, ['--check', path], {stdio:'inherit'}).status !== 0) throw new Error('Invalid JS: ' + path);
}
