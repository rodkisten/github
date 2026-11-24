import { readFileSync } from 'node:fs';
import * as github from '@actions/github';
import { runAction } from '../utils/action.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger } from '../utils/logger.js';
import { MARKER, parseReport, renderReport } from './render.js';

import { workflowSections } from './metrics.js';
import { bundleSections, parseSnapshot } from './bundle.js';
import { gitSections, previousVerifiedSha } from './git.js';

runAction('Rod Preview Report', async () => {
  const { owner, repo } = github.context.repo;
  const inputs = getInputs({
    'github-token': { required: true, secret: true },
    'pr-number': { required: true, parse: raw => {
      const n = Number(raw);
      if (!Number.isSafeInteger(n) || n <= 0) throw new Error('Invalid PR number');
      return n;
    }},
    'results-file': { required: true },
    'bundle-file': { default: '' },
    'baseline-file': { default: '' },
    'bot-login': { default: 'github-actions[bot]' },
  });
  const report = parseReport(JSON.parse(readFileSync(inputs['results-file'], 'utf8')));
  const api = github.getOctokit(inputs['github-token']);
  const pull_number = inputs['pr-number'];
  const pr = await api.rest.pulls.get({ owner, repo, pull_number });
  if (pr.data.state !== 'open' || pr.data.head.sha !== report.sha) {
    logger.info('Skipping stale or closed PR report');
    return;
  }
  const login = inputs['bot-login'];
  const comments = await api.paginate(api.rest.issues.listComments, { owner, repo, issue_number: pull_number, per_page: 100 });
  const existing = comments.find(c => c.body?.startsWith(MARKER) && c.user?.login === login);
  const params = { owner, repo, pull_number, per_page: 100 };
  const [commits, files] = await Promise.all([
    api.paginate(api.rest.pulls.listCommits, params),
    api.paginate(api.rest.pulls.listFiles, params),
  ]);
  const sections = gitSections(commits, files, {
    commits: pr.data.commits, files: pr.data.changed_files,
    additions: pr.data.additions, deletions: pr.data.deletions,
  });
  if (inputs['bundle-file']) {
    const current = parseSnapshot(JSON.parse(readFileSync(inputs['bundle-file'], 'utf8')));
    const baseline = inputs['baseline-file'] ? parseSnapshot(JSON.parse(readFileSync(inputs['baseline-file'], 'utf8'))) : undefined;
    sections.push(...bundleSections(current, baseline));
  }
  try {
    const run_id = github.context.runId;
    const [jobs, artifacts] = await Promise.all([
      api.paginate(api.rest.actions.listJobsForWorkflowRunAttempt, { owner, repo, run_id, attempt_number: Number(process.env.GITHUB_RUN_ATTEMPT || 1), per_page: 100 }),
      api.paginate(api.rest.actions.listWorkflowRunArtifacts, { owner, repo, run_id, per_page: 100 }),
    ]);
    sections.push(...workflowSections(jobs, artifacts));
  } catch {
    sections.push({title:'Workflow intelligence',rows:[{label:'Metrics',value:'Unavailable (check Actions read permission)'}]});
  }
  const previous = previousVerifiedSha(existing?.body ?? undefined);
  if (previous && previous !== report.sha) {
    try {
      const comparison = await api.rest.repos.compareCommits({ owner, repo, base: previous, head: report.sha, per_page: 1 });
      sections.push({ title: 'Since last verified preview', rows: [
        { label: 'Previous revision', value: previous.slice(0, 7) },
        { label: 'Comparison', value: comparison.data.status },
        { label: 'Ahead / behind', value: comparison.data.ahead_by + ' / ' + comparison.data.behind_by },
      ] });
    } catch {
      sections.push({ title: 'Since last verified preview', rows: [{ label: 'Comparison', value: 'Unavailable' }] });
    }
  }
  const latest = await api.rest.pulls.get({ owner, repo, pull_number });
  if (latest.data.state !== 'open' || latest.data.head.sha !== report.sha || latest.data.base.sha !== pr.data.base.sha) {
    logger.info('Skipping report because PR changed during collection');
    return;
  }
  const verified = report.status === 'success' ? report.sha : previous;
  const body = renderReport({ ...report, sections: [...(report.sections ?? []), ...sections] }, owner + '/' + repo, github.context.runId)
    + (verified ? '\n<!-- rod-preview-verified-sha:' + verified + ' -->' : '');
  const result = existing
    ? await api.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body })
    : await api.rest.issues.createComment({ owner, repo, issue_number: pull_number, body });
  setOutputs({ 'comment-url': result.data.html_url });
});
