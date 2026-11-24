import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, lstatSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { resolve, relative, sep } from 'node:path';
const [output, ...files] = process.argv.slice(2);
if (!output || !files.length || files.length > 500) throw new Error('Usage: node measure-bundles.mjs OUTPUT FILE...');
const entries = new Map();
for (const file of files) {
  const path = resolve(file);
  const name = relative(process.cwd(), path).split(sep).join('/');
  if (name.startsWith('../') || !lstatSync(path).isFile()) throw new Error('Expected regular workspace file: '+file);
  const data = readFileSync(path);
  entries.set(name, {sha256:createHash('sha256').update(data).digest('hex'),raw:data.length,gzip:gzipSync(data,{level:9}).length,brotli:brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}).length});
}
writeFileSync(output, JSON.stringify(Object.fromEntries(entries),null,2)+'\n');
