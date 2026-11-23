import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

function discoverActions(srcDir = 'src'): string[] {
  return readdirSync(srcDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && existsSync(join(srcDir, dirent.name, 'index.ts')))
    .map((dirent) => dirent.name);
}

const actions = discoverActions('src');

export default defineConfig({
  entry: Object.fromEntries(actions.map((name) => [name, `./src/${name}/index.ts`])),

  format: 'esm',

  outExtensions: () => ({
    js: '.js',
  }),

  platform: 'node',
  target: 'node24',

  outDir: 'dist',

  // Limpa apenas o diretório de saída e reconstrói todas as entradas.
  clean: true,

  // Mantém dependências das Actions dentro dos bundles para execução standalone.
  noExternal: [
    /^@actions\//,
    /^@octokit\//,
    /^yaml$/,
    /^picomatch$/,
    /^handlebars$/,
  ],

  onSuccess() {
    for (const name of actions) {
      const srcYml = join('src', name, 'action.yml');
      if (!existsSync(srcYml)) continue;

      const destDir = join('dist', name);
      mkdirSync(destDir, { recursive: true });

      const content = readFileSync(srcYml, 'utf8').replace(
        new RegExp(`(\\.\\./)+dist/${name}\\.js`),
        `../${name}.js`
      );

      writeFileSync(join(destDir, 'action.yml'), content, 'utf8');
    }
  },
});
