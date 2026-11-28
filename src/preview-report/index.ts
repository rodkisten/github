import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { runAction } from '../utils/action.js';
import { MARKER, parseReport, renderReport } from './render.js';

import { workflowSections } from './metrics.js';
import { bundleSections, parseSnapshot, historicalSection } from './bundle.js';
import { gitSections, previousVerifiedSha } from './git.js';

runAction('Rod Preview Report', async ({ utils, logger, octoKit: github }) => {
  const { getInputs, setOutputs } = utils;
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
    'history-artifact': { default: '' },
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
  }, owner+'/'+repo);
  if (inputs['bundle-file']) {
    const current = parseSnapshot(JSON.parse(readFileSync(inputs['bundle-file'], 'utf8')));
    const baseline = inputs['baseline-file'] ? parseSnapshot(JSON.parse(readFileSync(inputs['baseline-file'], 'utf8'))) : undefined;
    sections.push(...bundleSections(current, baseline));
    if (inputs['history-artifact']) {
      let directory: string | undefined;
      try {
        const run = await api.rest.actions.getWorkflowRun({owner,repo,run_id:github.context.runId});
        const candidates = await api.rest.actions.listWorkflowRuns({owner,repo,workflow_id:run.data.workflow_id,event:'pull_request',status:'success',branch:pr.data.head.ref,per_page:100});
        const previousRuns = candidates.data.workflow_runs.filter(r=>r.id!==run.data.id && r.run_number<run.data.run_number && r.head_repository?.id===pr.data.head.repo?.id && r.pull_requests?.some(p=>p.number===pull_number)).sort((a,b)=>b.run_number-a.run_number);
        const reference = previousRuns[0];
        if (!reference) throw new Error('No earlier successful run associated with this PR');
        const artifacts = await api.rest.actions.listWorkflowRunArtifacts({owner,repo,run_id:reference.id,name:inputs['history-artifact'],per_page:100});
        if (!artifacts.data.artifacts.some(a=>!a.expired && a.name===inputs['history-artifact'])) throw new Error('Previous snapshot unavailable');
        directory=mkdtempSync(join(tmpdir(),'rod-bundle-history-'));
        execFileSync('gh',['run','download',String(reference.id),'-R',owner+'/'+repo,'-n',inputs['history-artifact'],'-D',directory],{env:{...process.env,GH_TOKEN:inputs['github-token']},timeout:30000,stdio:'pipe'});
        const prior=parseSnapshot(JSON.parse(readFileSync(join(directory,basename(inputs['bundle-file'])),'utf8')));
        const history=historicalSection(current,prior,reference.id);
        history.rows[0].url='https://github.com/'+owner+'/'+repo+'/actions/runs/'+reference.id;
        sections.push(history);
      } catch {
        sections.push({title:'Since last successful build',rows:[{label:'Reference',value:'Unavailable (no matching accessible snapshot)'}]});
      } finally {
        if(directory) rmSync(directory,{recursive:true,force:true});
      }
    }
  }
  try {
    const run_id = github.context.runId;
    const [jobs, artifacts] = await Promise.all([
      api.paginate(api.rest.actions.listJobsForWorkflowRunAttempt, { owner, repo, run_id, attempt_number: Number(process.env.GITHUB_RUN_ATTEMPT || 1), per_page: 100 }),
      api.paginate(api.rest.actions.listWorkflowRunArtifacts, { owner, repo, run_id, per_page: 100 }),
    ]);
    sections.push(...workflowSections(jobs, artifacts, owner+'/'+repo, run_id));
  } catch {
    sections.push({title:'Workflow intelligence',rows:[{label:'Metrics',value:'Unavailable (check Actions read permission)'}]});
  }
  const previous = previousVerifiedSha(existing?.body ?? undefined);
  if (previous && previous !== report.sha) {
    try {
      const comparison = await api.rest.repos.compareCommits({ owner, repo, base: previous, head: report.sha, per_page: 1 });
      sections.push({ title: 'Since last verified preview', rows: [
        { label: 'Previous revision', value: previous.slice(0, 7), url:'https://github.com/'+owner+'/'+repo+'/commit/'+previous },
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
