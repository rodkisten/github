import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: { 'paths-filter': 'src/paths-filter/index.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@actions\//, /^yaml$/, /^picomatch$/],
});
