import { describe,it,expect } from 'vitest';
import { measure,parseSnapshot,bundleSections } from '../src/preview-report/bundle.js';
describe('bundle metrics',()=>{
  it('measures actual bytes and compression',()=>{
    const size=measure(Buffer.from('hello '.repeat(1000)));
    expect(size.raw).toBe(6000);
    expect(size.gzip).toBeLessThan(size.raw);
    expect(size.brotli).toBeLessThan(size.raw);
  });
  it('compares totals including removed files',()=>{
    const base={a:{raw:1024,gzip:512,brotli:256},b:{raw:1024,gzip:512,brotli:256}};
    const current={a:{raw:1024,gzip:512,brotli:256}};
    expect(bundleSections(current,base)[0]?.rows[0]?.value).toContain('−1.00 KiB');
    expect(bundleSections(current,base)[2]?.rows[0]?.label).toBe('b');
  });
  it('rejects negative and noninteger sizes',()=>{
    expect(()=>parseSnapshot({a:{raw:-1,gzip:2,brotli:3}})).toThrow();
  });
});
