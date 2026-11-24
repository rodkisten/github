import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error JavaScript runtime module has no declaration file.
import { detect } from '../scripts/detect-workspace.mjs';

function fixture(files: Record<string,string>, fn: (dir:string)=>void) {
  const dir = mkdtempSync(join(tmpdir(),'rod-workspace-'));
  try { for (const [name,value] of Object.entries(files)) writeFileSync(join(dir,name),value); fn(dir); }
  finally { rmSync(dir,{recursive:true,force:true}); }
}
describe('workspace detection',()=>{
  it.each([['npm','package-lock.json'],['pnpm','pnpm-lock.yaml'],['yarn','yarn.lock'],['bun','bun.lock'],['bun','bun.lockb']])('detects %s via %s',(manager,lock)=>fixture({[lock]:''},dir=>expect(detect(dir).manager).toBe(manager)));
  it('prefers declared manager',()=>fixture({'package.json':'{"packageManager":"pnpm@10.28.2"}','yarn.lock':''},dir=>expect(detect(dir)).toMatchObject({manager:'pnpm',version:'10.28.2'})));
  it('rejects ambiguous lockfiles',()=>fixture({'yarn.lock':'','package-lock.json':''},dir=>expect(()=>detect(dir)).toThrow('Conflicting lockfiles')));
  it('supports explicit override',()=>fixture({'yarn.lock':'','package-lock.json':''},dir=>expect(detect(dir,'npm').manager).toBe('npm')));
  it('does not install outside JS projects',()=>fixture({},dir=>expect(detect(dir).manager).toBe('none')));
});
