export const MARKER = '<!-- rod-preview-report:v1 -->';

export interface PreviewReport {
  title: string;
  url: string;
  sha: string;
  status: 'success' | 'failure' | 'pending';
}

const escapeText = (value: string) => value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c)).replace(/[\\`*_\[\]|]/g, c => '\\' + c).replace(/[\r\n]/g, ' ');

export function parseReport(value: unknown): PreviewReport {
  if (!value || typeof value !== 'object') throw new Error('Invalid preview report');
  const r = value as Record<string, unknown>;
  if (typeof r.title !== 'string' || !r.title.trim() || r.title.length > 200 ||
      typeof r.url !== 'string' || !/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s<>()]*)?$/.test(r.url) ||
      typeof r.sha !== 'string' || !/^[a-f0-9]{40}$/.test(r.sha) ||
      !['success', 'failure', 'pending'].includes(String(r.status))) throw new Error('Invalid preview report fields');
  return r as unknown as PreviewReport;
}

export function renderReport(r: PreviewReport, repository: string, runId: number): string {
  const status = { success: '✅ Verified', failure: '❌ Failed', pending: '⏳ Pending' }[r.status];
  return [MARKER, '## ' + escapeText(r.title), '', '**Status:** ' + status, '',
    ...(r.status === 'success' ? ['[Open preview](' + r.url + ')', ''] : []),
    '| Revision | Workflow |', '| :-- | :-- |',
    '| [' + r.sha.slice(0, 7) + '](https://github.com/' + repository + '/commit/' + r.sha + ') | [Run](https://github.com/' + repository + '/actions/runs/' + runId + ') |',
    '', '_Managed by Rod Preview Report. Updated in place._'].join('\n');
}
