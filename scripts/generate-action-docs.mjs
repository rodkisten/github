import { globSync, readFileSync, writeFileSync } from 'node:fs';
import YAML from 'yaml';

const target = 'docs/ACTION_CATALOG.md';
const cell = (value) => String(value ?? '').replaceAll('|', '&#124;').replace(/\r?\n/g, ' ');
const paths = globSync('src/*/action.yml').sort();
const actions = paths.map(path => ({ path, name: path.split('/')[1], manifest: YAML.parse(readFileSync(path, 'utf8')) }));
const lines = ['# Action catalog', '', 'Generated from public action manifests. Do not edit manually.', '', '## Index', ''];
for (const {name, manifest} of actions) lines.push('- [' + name + '](#' + name + '): ' + cell(manifest.description));
for (const {name, manifest} of actions) {
  lines.push('', '## ' + name, '', cell(manifest.description), '', 'Runtime: `' + manifest.runs.using + '`', '', '### Inputs', '');
  const inputs = Object.entries(manifest.inputs ?? {});
  if (inputs.length) {
    lines.push('| Input | Required | Default | Description |', '|---|---|---|---|');
    for (const [key, input] of inputs) lines.push('| `' + key + '` | ' + (input.required ? 'Yes' : 'No') + ' | ' + cell(input.default) + ' | ' + cell(input.description) + ' |');
  } else lines.push('None.');
  lines.push('', '### Outputs', '');
  const outputs = Object.entries(manifest.outputs ?? {});
  if (outputs.length) {
    lines.push('| Output | Description |', '|---|---|');
    for (const [key, output] of outputs) lines.push('| `' + key + '` | ' + cell(output.description) + ' |');
  } else lines.push('None.');
  lines.push('', '### Usage template', '', '```yaml', '- uses: rodkisten/github/src/' + name + '@main');
  const required = inputs.filter(([,input]) => input.required && input.default === undefined);
  if (required.length) {
    lines.push('  with:');
    for (const [key] of required) lines.push('    ' + key + ': ' + JSON.stringify('<provide ' + key + '>'));
  }
  lines.push('```', '', 'See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.');
}
const output = lines.join('\n') + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Action catalog is stale; run npm run docs:actions');
} else writeFileSync(target, output);
