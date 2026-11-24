import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import type { ReportSection } from './render.js';

export interface BundleSize { raw: number; gzip: number; brotli: number; sha256?: string }
export type BundleSnapshot = Record<string, BundleSize>;

export function measure(data: Buffer): BundleSize {
  return { sha256: createHash('sha256').update(data).digest('hex'), raw: data.length, gzip: gzipSync(data, { level: 9 }).length,
    brotli: brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length };
}

export function parseSnapshot(value: unknown): BundleSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid bundle snapshot');
  const entries = Object.entries(value);
  if (entries.length > 500) throw new Error('Too many bundle entries');
  for (const [name, size] of entries) {
    if (!name || name.length > 500 || !size || typeof size !== 'object' ||
      !['raw','gzip','brotli'].every(k => Number.isSafeInteger(size[k]) && size[k] >= 0) || (size.sha256 !== undefined && (typeof size.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(size.sha256)))) throw new Error('Invalid bundle size: ' + name);
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

// Only normalize Vite-style hashed asset names. Ambiguous identities stay unmatched.
export function logicalName(name: string): string {
  return name.includes('/assets/') ? name.replace(/-[A-Za-z0-9_-]{8}(?=\.(?:m?js|css|wasm)$)/, '') : name;
}

export function matchBundles(current: BundleSnapshot, baseline: BundleSnapshot): Map<string,string> {
  const matches = new Map<string,string>();
  const used = new Set<string>();
  for (const name of Object.keys(current)) {
    if (Object.hasOwn(baseline,name)) { matches.set(name,name); used.add(name); }
  }
  const group = (names: string[]) => {
    const groups = new Map<string,string[]>();
    for (const name of names) {
      const key = logicalName(name);
      groups.set(key,[...(groups.get(key) ?? []),name]);
    }
    return groups;
  };
  const left = group(Object.keys(current).filter(n=>!matches.has(n)));
  const right = group(Object.keys(baseline).filter(n=>!used.has(n)));
  for (const [key,names] of left) {
    const candidates = right.get(key);
    if (names.length===1 && candidates?.length===1) matches.set(names[0],candidates[0]);
  }
  return matches;
}

// Fingerprints are optional for backward compatibility with existing baselines.
export function duplicateGroups(snapshot: BundleSnapshot) {
  const groups = new Map<string,string[]>();
  for (const [name,size] of Object.entries(snapshot)) {
    if (!size.sha256) continue;
    const key = size.sha256 + ':' + size.raw;
    groups.set(key,[...(groups.get(key) ?? []),name]);
  }
  return [...groups.values()].filter(names=>names.length>1).map(names=>({
    names:names.sort(), bytes:snapshot[names[0]].raw*(names.length-1)
  })).sort((a,b)=>b.bytes-a.bytes);
}

export function bundleSections(current: BundleSnapshot, baseline?: BundleSnapshot): ReportSection[] {
  const now = total(current);
  const before = baseline ? total(baseline) : undefined;
  const keys = ['raw','gzip','brotli'] as const;
  const matches = baseline ? matchBundles(current,baseline) : new Map<string,string>();
  const used = new Set(matches.values());
  const category = (name:string) => /\.wasm$/i.test(name) ? 'WASM' : /\.css$/i.test(name) ? 'CSS' : /\.m?js$/i.test(name) ? 'JavaScript' : 'Other';
  const subset = (snapshot:BundleSnapshot, kind:string) => total(Object.fromEntries(Object.entries(snapshot).filter(([name])=>category(name)===kind)));
  const changes = baseline ? Object.entries(current).map(([name,size])=>({name,change:size.raw-(baseline[matches.get(name) ?? '']?.raw ?? 0)})).filter(x=>x.change>0).sort((a,b)=>b.change-a.change) : [];
  const duplicates = duplicateGroups(current);
  const coverage = Object.values(current).filter(size=>size.sha256).length;
  return [
    {title:'Bundle totals', rows: keys.map(k => ({label:k, value:kib(now[k]) + (before ? ' · Δ ' + delta(now[k],before[k]) : ''),
      ...(before ? {status: now[k]>before[k] ? 'failure' as const : 'success' as const} : {})}))},
    {title:'Bundle files (up to 40)', collapsed:true, rows: Object.keys(current).sort((a,b)=>current[b].raw-current[a].raw).slice(0,40).map(name=>({
      label:name, value:keys.map(k=>k+': '+kib(current[name][k])).join(' · ') +
        (baseline ? matches.has(name) ? ' · raw Δ '+delta(current[name].raw,baseline[matches.get(name)!].raw) : ' · New or unmatched file' : '')
    }))},
    ...(baseline ? [{title:'Removed bundles',collapsed:true,rows:Object.keys(baseline).filter(name=>!used.has(name)).slice(0,40).map(name=>({label:name,value:kib(baseline[name].raw)}))}] : []),
    {title:'Bundle composition',rows:['WASM','JavaScript','CSS','Other'].map(kind=>{
      const size=subset(current,kind);
      const old=baseline?subset(baseline,kind):undefined;
      return {label:kind,value:keys.map(k=>k+': '+kib(size[k])+(old?' (Δ '+delta(size[k],old[k])+')':'')).join(' · ')};
    })},
    {title:'Content intelligence', rows:[{label:'Fingerprint coverage',value:coverage+' / '+Object.keys(current).length},{label:'Identical content groups',value:coverage?String(duplicates.length):'Not measured'},{label:'Potential duplicate raw bytes',value:coverage?kib(duplicates.reduce((sum,g)=>sum+g.bytes,0)):'Not measured'}]},
    ...(duplicates.length ? [{title:'Identical files (review before removing)',collapsed:true,rows:duplicates.slice(0,10).map(g=>({label:g.names[0],value:kib(g.bytes)+' potential savings · '+g.names.slice(1,5).join(', ')+(g.names.length>5?' · additional copies omitted':'')}))}] : []),
    ...(baseline ? [{title:'Largest raw increases',collapsed:true,rows:changes.slice(0,10).map(x=>({label:x.name,value:'+'+kib(x.change)}))}] : []),
  ];
}
