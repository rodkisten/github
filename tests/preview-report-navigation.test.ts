import {describe,it,expect} from 'vitest';
import {renderReport,parseReport,MARKER} from '../src/preview-report/render.js';
const report={title:'Preview',url:'https://example.com/',sha:'a'.repeat(40),status:'success' as const};
describe('dashboard navigation',()=>{
  it('renders validated row links',()=>{
    const body=renderReport({...report,sections:[{title:'Artifacts',rows:[{label:'Bundle',value:'1 KiB',url:'https://github.com/a/b/actions/runs/1/artifacts/2'}]}]},'a/b',1);
    expect(body).toContain('[Bundle](https://github.com/a/b/actions/runs/1/artifacts/2)');
  });
  it('rejects unsafe row URLs',()=>{
    expect(()=>parseReport({...report,sections:[{title:'Artifacts',rows:[{label:'Bundle',value:'1',url:'javascript:alert(1)'}]}]})).toThrow();
  });
  it('omits whole sections rather than breaking markdown or the ownership marker',()=>{
    const body=renderReport({...report,sections:Array.from({length:100},()=>({title:'Large',collapsed:true,rows:[{label:'File',value:'😀'.repeat(1000)}]}))},'a/b',1);
    expect(Buffer.byteLength(body)).toBeLessThanOrEqual(60000);
    expect(body.startsWith(MARKER)).toBe(true);
    expect(body).toContain('Additional sections omitted');
    expect(body.match(/<details>/g)?.length).toBe(body.match(/<\/details>/g)?.length);
  });
});
