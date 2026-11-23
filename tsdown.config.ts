import { readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { defineConfig } from 'tsdown';

function discoverEntries(srcDir = 'src'): Record<string, string> {
  const entries: Record<string, string> = {};

  // Pastas internas compartilhadas que não são entrypoints de build
  const ignoredDirs = new Set(['utils', 'types', 'shared', 'lib', 'helpers']);

  for (const dirent of readdirSync(srcDir, { withFileTypes: true })) {
    if (!dirent.isDirectory() || ignoredDirs.has(dirent.name)) continue;

    const dirName = dirent.name;
    const dirPath = join(srcDir, dirName);

    for (const file of readdirSync(dirPath, { withFileTypes: true })) {
      if (!file.isFile() || extname(file.name) !== '.ts' || file.name.endsWith('.d.ts')) {
        continue;
      }

      const fileBase = basename(file.name, '.ts');
      const relativePath = `src/${dirName}/${file.name}`;

      if (fileBase === 'index') {
        entries[dirName] = relativePath;
      } else {
        // Ex: src/format/report.ts -> 'format-report'
        // Caso tenha arquivos auxiliares na pasta que não devem virar bundle (ex: helper.ts),
        // prefixe-os com `_` (ex: `_helper.ts`) ou coloque em uma subpasta.
        if (!fileBase.startsWith('_')) {
          entries[`${dirName}-${fileBase}`] = relativePath;
        }
      }
    }
  }

  return entries;
}

export default defineConfig({
  entry: discoverEntries('src'),

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
});
