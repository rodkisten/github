// Composite shells cannot reliably preserve environment keys containing hyphens.
// Restore the exact @actions/core input convention inside the Node process.
const name = process.argv[2];
const allowed = new Set(['commit', 'publish', 'create-pr', 'format-report', 'console', 'paths-filter', 'preview-report']);
if (!allowed.has(name)) throw new Error('Unknown action: ' + name);
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('ROD_INPUT_')) {
    process.env['INPUT_' + key.slice(10).replaceAll('_', '-')] = value;
    delete process.env[key];
  }
}
const bundle = new URL('../dist/' + name + '.js', import.meta.url);
await import(bundle.href);
