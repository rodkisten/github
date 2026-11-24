import { describe,it,expect } from 'vitest';
import { workflowSections } from '../src/preview-report/metrics.js';
describe('workflow metrics',()=>{
  it('excludes running steps and expired artifacts',()=>{
    const start='2026-01-01T00:00:00Z', end='2026-01-01T00:00:10Z';
    const sections=workflowSections([{name:'Build',started_at:start,completed_at:end,steps:[{name:'Compile',started_at:start,completed_at:end},{name:'Running',started_at:start}]}],[{name:'old',size_in_bytes:100,expired:true}]);
    expect(sections[0]?.rows[1]?.value).toBe('10.0 s');
    expect(sections[1]?.rows).toHaveLength(1);
    expect(sections[2]?.rows).toHaveLength(0);
  });
});
