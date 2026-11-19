import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: { 'paths-filter': 'src/paths-filter/index.ts', 'node-ci': 'src/node-ci/index.ts', 'ci-summary': 'src/ci-summary/index.ts', 'create-pr': 'src/create-pr/index.ts', 'commit': 'src/commit/index.ts' },
  format: 'esm',
  outExtensions: () => ({ js: '.js' }),
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@actions\//, /^yaml$/, /^picomatch$/],
});
