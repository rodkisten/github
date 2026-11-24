import { describe,it,expect } from 'vitest';
import { measure,parseSnapshot,bundleSections,matchBundles } from '../src/preview-report/bundle.js';
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

it('matches changed Vite hashes without treating them as new files',()=>{
  const size={raw:100,gzip:50,brotli:40};
  const base={'dist/assets/App-AbCd1234.js':size};
  const current={'dist/assets/App-ZyXw9876.js':size};
  expect(matchBundles(current,base).get('dist/assets/App-ZyXw9876.js')).toBe('dist/assets/App-AbCd1234.js');
  expect(bundleSections(current,base)[2]?.rows).toEqual([]);
});
it('does not guess when multiple hashed chunks share a logical name',()=>{
  const size={raw:100,gzip:50,brotli:40};
  expect(matchBundles({'dist/assets/App-AbCd1234.js':size,'dist/assets/App-AbCd1235.js':size},{'dist/assets/App-ZyXw9876.js':size}).size).toBe(0);
});
it('groups bytes by format',()=>{
  const sections=bundleSections({'a.wasm':{raw:1024,gzip:512,brotli:256}});
  expect(sections.find(s=>s.title==='Bundle composition')?.rows[0]?.value).toContain('raw: 1.00 KiB');
});
