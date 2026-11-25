import { bannerMarkdown } from '../../packages/comment-kit/index.mjs';
export const MARKER = '<!-- rod-preview-report:v1 -->';

export interface ReportSection {
  title: string;
  collapsed?: boolean;
  rows: { label: string; value: string; url?: string; status?: 'success' | 'failure' | 'pending' }[];
}

export interface PreviewReport {
  banner?: string;
  description?: string;
  sections?: ReportSection[];
  links?: { label: string; url: string }[];
  title: string;
  url: string;
  sha: string;
  status: 'success' | 'failure' | 'pending';
}

const escapeText = (value: string) => value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c)).replace(/[\\`*_\[\]|]/g, c => '\\' + c).replace(/[\r\n]/g, ' ');

const safeUrl = (v: unknown): v is string => typeof v === 'string' && v.length <= 2048 && /^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s<>()\[\]\\]*)?$/.test(v);
const boundedText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const validStatus = (v: unknown) => v === 'success' || v === 'failure' || v === 'pending';

export function parseReport(value: unknown): PreviewReport {
  if (!value || typeof value !== 'object') throw new Error('Invalid preview report');
  const r = value as Record<string, unknown>;
  if (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 200 ||
      !safeUrl(r.url) ||
      typeof r.sha !== 'string' || !/^[a-f0-9]{40}$/.test(r.sha) ||
      !['success', 'failure', 'pending'].includes(String(r.status))) throw new Error('Invalid preview report fields');
  if (r.banner !== undefined && !safeUrl(r.banner)) throw new Error('Invalid banner URL');
  if (r.description !== undefined && !boundedText(r.description, 1000)) throw new Error('Invalid description');
  if (r.links !== undefined && (!Array.isArray(r.links) || r.links.length > 10 ||
    !r.links.every(l => l && boundedText(l.label, 100) && safeUrl(l.url)))) throw new Error('Invalid report links');
  if (r.sections !== undefined && (!Array.isArray(r.sections) || r.sections.length > 10 ||
    !r.sections.every(s => s && boundedText(s.title, 100) &&
      (s.collapsed === undefined || typeof s.collapsed === 'boolean') &&
      Array.isArray(s.rows) && s.rows.length <= 20 &&
      s.rows.every((row: ReportSection['rows'][number]) => row && boundedText(row.label, 100) &&
        boundedText(row.value, 500) && (row.url === undefined || safeUrl(row.url)) && (row.status === undefined || validStatus(row.status)))))) throw new Error('Invalid report sections');
  return r as unknown as PreviewReport;
}

export function renderReport(r: PreviewReport, repository: string, runId: number): string {
  const status = { success: '✅ Verified', failure: '❌ Failed', pending: '⏳ Pending' }[r.status];
  const icons = { success: '✅ ', failure: '❌ ', pending: '⏳ ' };
  const sections = (r.sections ?? []).map(s => [
    ...(s.collapsed ? ['<details><summary>' + escapeText(s.title) + '</summary>', ''] : ['### ' + escapeText(s.title), '']),
    '| Metric | Value |', '| :-- | :-- |',
    ...s.rows.map(row => '| ' + (safeUrl(row.url) ? '[' + escapeText(row.label) + '](' + row.url + ')' : escapeText(row.label)) + ' | ' + (row.status ? icons[row.status] : '') + escapeText(row.value) + ' |'),
    '', ...(s.collapsed ? ['</details>', ''] : []),
  ]);
  const header = [MARKER, ...(r.banner ? ['![Preview banner](' + r.banner + ')', ''] : [bannerMarkdown(r.status === 'failure' ? 'failure' : 'preview'), '']), '## ' + escapeText(r.title), '',
    ...(r.description ? [escapeText(r.description), ''] : []), '**Status:** ' + status, '',
    ...(r.status === 'success' ? ['[Open preview](' + r.url + ')', ''] : []),
    '| Revision | Workflow |', '| :-- | :-- |',
    '| [' + r.sha.slice(0, 7) + '](https://github.com/' + repository + '/commit/' + r.sha + ') | [Run](https://github.com/' + repository + '/actions/runs/' + runId + ') |',
    ''].join('\n');
  const footer = [...(r.links?.length ? ['### Resources', '', ...r.links.map(l => '- [' + escapeText(l.label) + '](' + l.url + ')'), ''] : []), '_Managed by Rod Preview Report. Updated in place._'].join('\n');
  // Reserve space for the verified revision marker appended by the caller.
  const limit = 60000;
  const notice = '\n_Additional sections omitted to fit the comment limit._\n';
  let body = header;
  let omitted = false;
  for (const section of sections) {
    const block = section.join('\n') + '\n';
    if (Buffer.byteLength(body + block + footer + notice,'utf8') > limit) { omitted=true; continue; }
    body += block;
  }
  return body + (omitted ? notice : '') + footer;
}
