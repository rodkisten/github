import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import type { ReportSection } from './render.js';

export interface BundleSize { raw: number; gzip: number; brotli: number }
export type BundleSnapshot = Record<string, BundleSize>;

export function measure(data: Buffer): BundleSize {
  return { raw: data.length, gzip: gzipSync(data, { level: 9 }).length,
    brotli: brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length };
}

export function parseSnapshot(value: unknown): BundleSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid bundle snapshot');
  const entries = Object.entries(value);
  if (entries.length > 500) throw new Error('Too many bundle entries');
  for (const [name, size] of entries) {
    if (!name || name.length > 500 || !size || typeof size !== 'object' ||
      !['raw','gzip','brotli'].every(k => Number.isSafeInteger(size[k]) && size[k] >= 0)) throw new Error('Invalid bundle size: ' + name);
  }
  return Object.fromEntries(entries);
}

const total = (snapshot: BundleSnapshot): BundleSize => Object.values(snapshot).reduce((a,b) => ({
  raw:a.raw+b.raw, gzip:a.gzip+b.gzip, brotli:a.brotli+b.brotli
}), {raw:0,gzip:0,brotli:0});
const kib = (n: number) => (n / 1024).toFixed(2) + ' KiB';
const delta = (n: number, base: number) => {
  const d = n-base;
  return (d>0?'+':d<0?'−':'') + kib(Math.abs(d)) + (base ? ' (' + (d/base*100).toFixed(1) + '%)' : '');
};

export function bundleSections(current: BundleSnapshot, baseline?: BundleSnapshot): ReportSection[] {
  const now = total(current);
  const before = baseline ? total(baseline) : undefined;
  const keys = ['raw','gzip','brotli'] as const;
  return [
    {title:'Bundle totals', rows: keys.map(k => ({label:k, value:kib(now[k]) + (before ? ' · Δ ' + delta(now[k],before[k]) : ''),
      ...(before ? {status: now[k]>before[k] ? 'failure' as const : 'success' as const} : {})}))},
    {title:'Bundle files (up to 40)', collapsed:true, rows: Object.keys(current).sort((a,b)=>current[b].raw-current[a].raw).slice(0,40).map(name=>({
      label:name, value:keys.map(k=>k+': '+kib(current[name][k])).join(' · ') +
        (baseline ? Object.hasOwn(baseline,name) ? ' · raw Δ '+delta(current[name].raw,baseline[name].raw) : ' · New file' : '')
    }))},
    ...(baseline ? [{title:'Removed bundles',collapsed:true,rows:Object.keys(baseline).filter(name=>!Object.hasOwn(current,name)).slice(0,40).map(name=>({label:name,value:kib(baseline[name].raw)}))}] : []),
  ];
}
