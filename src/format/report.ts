import * as core from '@actions/core';
import * as github from '@actions/github';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

type Result = { language: string; tool: string; files: number; status: string; detail?: string };
const marker = '<!-- rod-format-report -->';
export function reportMarkdown(results: Result[], changed: string[], mode: string, scope: string): string {
  const counts = { ok: results.filter(x => x.status === 'ok').length, failed: results.filter(x => x.status === 'failed').length, skipped: results.filter(x => x.status === 'skipped').length };
  const commit = 'style(format): normalize ' + changed.length + ' files [skip ci]';
  return [marker, '## 🎨 Rod Format · ' + mode.toUpperCase(), '',
    '> **Scope:** `' + scope + '` · **Tools passed:** ' + counts.ok + ' · **Failed:** ' + counts.failed + ' · **Skipped:** ' + counts.skipped,
    '', '| Language | Tool | Files | Status |', '|:--|:--|--:|:--|',
    ...results.map(x => '| ' + x.language + ' | ' + x.tool + ' | ' + x.files + ' | ' + (x.status === 'ok' ? '✅' : x.status === 'failed' ? '❌' : '⚠️') + ' ' + x.status + ' |'),
    '', '<details><summary>📂 Files changed (' + changed.length + ')</summary>', '',
    ...changed.map(x => '- `' + x.replaceAll('`', '') + '`'), '', '</details>', '',
    '### 📝 Suggested commit', '', '```text', commit, '```', '',
    ...results.filter(x => x.status !== 'ok').map(x => '<details><summary>' + (x.status === 'failed' ? '❌' : '⚠️') + ' ' + x.tool + '</summary>\n\n```text\n' + (x.detail || x.status).replaceAll('```', '') + '\n```\n</details>'), '',
    '_Updated by Rod Actions Console. This comment is edited in place._'].join('\n');
}
export async function main(): Promise<void> {
  const token = core.getInput('github-token', { required: true });
  const pull = Number(core.getInput('pr-number', { required: true }));
  if (!Number.isSafeInteger(pull) || pull <= 0) throw new Error('Invalid PR number');
  const results = JSON.parse(readFileSync(core.getInput('results-file', { required: true }), 'utf8')) as Result[];
  const changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const body = reportMarkdown(results, changed, core.getInput('mode') || 'check', core.getInput('scope') || 'changed');
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const comments = await octokit.paginate(octokit.rest.issues.listComments, { owner, repo, issue_number: pull, per_page: 100 });
  const existing = comments.find(c => c.body?.includes(marker) && c.user?.type === 'Bot');
  if (existing) await octokit.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
  else await octokit.rest.issues.createComment({ owner, repo, issue_number: pull, body });
  core.setOutput('comment-updated', 'true');
}
main().catch(e => core.setFailed(e instanceof Error ? e.message : String(e)));
