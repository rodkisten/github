import { defineConfig } from 'tsdown';

const entries = {
  'paths-filter': 'src/paths-filter/index.ts',
  'node-ci': 'src/node-ci/index.ts',
  'ci-summary': 'src/ci-summary/index.ts',
  'create-pr': 'src/create-pr/index.ts',
  commit: 'src/commit/index.ts',
  console: 'src/console/index.ts',
  'console-run': 'src/console/runner.ts',
  format: 'src/format/entry.ts',
  'format-report': 'src/format/report-entry.ts',
};

export default defineConfig(
  Object.entries(entries).map(([name, entry]) => ({
    entry: { [name]: entry },
    format: 'esm',
    outExtensions: () => ({ js: '.js' }),
    platform: 'node',
    target: 'node24',
    outDir: 'dist',
    clean: false,
    outputOptions: { codeSplitting: false },
    deps: { alwaysBundle: [/^@actions\//, /^yaml$/, /^picomatch$/] },
  })),
);
