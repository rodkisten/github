
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    // 🔎 Repository automation
    'paths-filter': 'src/paths-filter/index.ts',

    // 🧪 CI orchestration
    'node-ci': 'src/node-ci/index.ts',
    'ci-summary': 'src/ci-summary/index.ts',

    // 🤖 GitHub App operations
    'create-pr': 'src/create-pr/index.ts',
    commit: 'src/commit/index.ts',

    // 📤 Publication and templates
    publish: 'src/publish/index.ts',
  },

  format: 'esm',

  outExtensions: () => ({
    js: '.js',
  }),

  platform: 'node',
  target: 'node24',

  outDir: 'dist',

  // Limpa apenas o diretório de saída e reconstrói todas as entradas.
  clean: true,

  // Mantém dependências das Actions dentro dos bundles.
  noExternal: [
    /^@actions\//,
    /^yaml$/,
    /^picomatch$/,
    /^handlebars$/,
  ],
});
