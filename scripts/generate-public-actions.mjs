import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const marker = '# Generated public action. DO NOT EDIT.';
const check = process.argv.includes('--check');
const expected = new Set();
const errors = [];

function rewrite(manifest) {
  const runs = manifest.runs;

  for (const key of ['main', 'pre', 'post']) {
    if (typeof runs[key] === 'string') {
      runs[key] = runs[key].replace(
        /^\.\.\/\.\.\//,
        '../',
      );
    }
  }

  for (const step of runs.steps ?? []) {
    if (typeof step.run === 'string') {
      step.run = step.run.replace(
        /(\$[A-Z_]+|\$\{\{ github\.action_path \}\})\/\.\.\/\.\.\//g,
        '$1/../',
      );
    }
  }

  return manifest;
}

for (const entry of fs.readdirSync(
  path.join(root, 'src'),
  { withFileTypes: true },
)) {
  if (!entry.isDirectory()) continue;

  const name = entry.name;
  const source = path.join(
    root, 'src', name, 'action.yml',
  );

  if (!fs.existsSync(source)) continue;

  const dir = path.join(root, name);
  const output = path.join(dir, 'action.yml');

  expected.add(name);

  const manifest = rewrite(
    parse(fs.readFileSync(source, 'utf8')),
  );

  if (!manifest.runs?.using) {
    throw new Error(`Invalid action: ${name}`);
  }

  const content = [
    marker,
    `# Source: src/${name}/action.yml`,
    '',
    stringify(manifest),
  ].join('\n');

  const previous = fs.existsSync(output)
    ? fs.readFileSync(output, 'utf8')
    : null;

  if (previous !== null &&
      !previous.startsWith(marker)) {
    throw new Error(
      `Unmanaged manifest: ${output}`,
    );
  }

  if (check) {
    if (previous !== content) {
      errors.push(`Outdated: ${name}`);
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(output, content);
  }

  for (const key of ['main', 'pre', 'post']) {
    const target = manifest.runs[key];

    if (typeof target === 'string' &&
        !fs.existsSync(path.resolve(dir, target))) {
      errors.push(`${name}: missing ${target}`);
    }
  }

  console.log(`✓ ${name}/action.yml`);
}

for (const entry of fs.readdirSync(root, {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  if (expected.has(entry.name)) continue;

  const dir = path.join(root, entry.name);
  const file = path.join(dir, 'action.yml');

  if (!fs.existsSync(file)) continue;

  if (!fs.readFileSync(file, 'utf8')
    .startsWith(marker)) continue;

  if (check) {
    errors.push(`Obsolete: ${entry.name}`);
  } else {
    fs.unlinkSync(file);

    if (!fs.readdirSync(dir).length) {
      fs.rmdirSync(dir);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `\n✓ ${expected.size} public actions`,
);
