import { describe, it, expect } from 'vitest';
import { parseReport, renderReport, MARKER } from '../src/preview-report/render.js';
const report = { title: 'Shell Preview', url: 'https://preview.example.com/', sha: 'a'.repeat(40), status: 'success' };
describe('preview report', () => {
  it('renders a stable marker and verified link', () => {
    const body = renderReport(parseReport(report), 'owner/repo', 123);
    expect(body.startsWith(MARKER)).toBe(true);
    expect(body).toContain('[Open preview](https://preview.example.com/)');
  });
  it('does not advertise a failed preview', () => {
    expect(renderReport(parseReport({...report, status: 'failure'}), 'owner/repo', 123)).not.toContain('[Open preview]');
  });
  it.each(['javascript:alert(1)', 'https://example.com/)'])('rejects unsafe URL %s', url => {
    expect(() => parseReport({...report, url})).toThrow();
  });
});

describe('declarative dashboard', () => {
  it('renders banner, collapsed metrics and resource links', () => {
    const body = renderReport(parseReport({...report, banner: 'https://example.com/banner.svg',
      sections: [{title: 'Build', collapsed: true, rows: [{label: 'Smoke test', value: 'Passed', status: 'success'}]}],
      links: [{label: 'Artifacts', url: 'https://example.com/artifacts'}]}), 'owner/repo', 123);
    expect(body).toContain('![Preview banner](https://example.com/banner.svg)');
    expect(body).toContain('<details><summary>Build</summary>');
    expect(body).toContain('| Smoke test | ✅ Passed |');
    expect(body).toContain('[Artifacts](https://example.com/artifacts)');
  });
  it('rejects invalid nested values and unsafe links', () => {
    expect(() => parseReport({...report, sections: [{title: 'Build', rows: [{label: 'Size', value: 42}]}]})).toThrow();
    expect(() => parseReport({...report, banner: 'javascript:alert(1)'})).toThrow();
  });
  it('escapes table separators', () => {
    expect(renderReport(parseReport({...report, sections: [{title: 'Build', rows: [{label: 'A|B', value: 'OK'}]}]}), 'owner/repo', 123)).toContain('A\\|B');
  });
});
