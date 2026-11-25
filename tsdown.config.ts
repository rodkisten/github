import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'tsdown';

// Lê as pastas de src apenas uma vez para reutilizar no build e no onSuccess
const srcDirs = readdirSync('src', { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const actionEntries = Object.fromEntries(
  srcDirs
    .filter((name) => existsSync(join('src', name, 'index.ts')))
    .map((name) => [name, `./src/${name}/index.ts`])
);

export default defineConfig({
  entry: {
    ...actionEntries,
    'format-report': './src/format/report.ts',
    'console-run': './src/console/runner.ts',
    'execute-js': './src/execute/javascript.ts',
  },

  format: 'esm',
  outExtensions: () => ({ js: '.js' }),
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,

  // --- Otimizações e Debug ---
  minify: true,
  treeshake: true,
  sourcemap: true, // Gera .js.map ao lado de cada bundle

  // Empacota TODAS as dependências externas automaticamente (ignora builtins node:*)
  noExternal: [/.*/],

  // Executa cópia e ajuste dos manifestos em paralelo
  async onSuccess() {
    await Promise.all(
      srcDirs.map(async (name) => {
        const srcYml = join('src', name, 'action.yml');
        if (!existsSync(srcYml)) return;

        const destDir = join('dist', name);
        await mkdir(destDir, { recursive: true });

        const raw = await readFile(srcYml, 'utf8');
        const updated = raw.replace(
          new RegExp(`(\\.\\./)+dist/${name}\\.js`),
          `../${name}.js`
        );

        await writeFile(join(destDir, 'action.yml'), updated, 'utf8');
      })
    );
  },
});
