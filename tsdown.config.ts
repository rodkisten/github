import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    // 🔐 Authentication & lifecycle
    'app-token': 'src/app-token/index.ts',
    'skip-ci': 'src/skip-ci/index.ts',

    // 🟩 Workspace & environment setup
    'setup-node': 'src/setup-node/index.ts',
    'setup-rodlog': 'src/setup-rodlog/index.ts',

    // 🔎 Repository automation
    'paths-filter': 'src/paths-filter/index.ts',

    // 🧪 CI orchestration
    'node-ci': 'src/node-ci/index.ts',
    'ci-summary': 'src/ci-summary/index.ts',

    // 🎨 Formatting & reporting
    format: 'src/format/index.ts',
    'format-report': 'src/format/report.ts',

    // 🧩 Console & instrumentation
    console: 'src/console/index.ts',
    'console-run': 'src/console/runner.ts',

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

  // Mantém dependências das Actions dentro dos bundles para execução standalone.
  noExternal: [
    /^@actions\//,
    /^@octokit\//,
    /^yaml$/,
    /^picomatch$/,
    /^handlebars$/,
  ],
});
