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
