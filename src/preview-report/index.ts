import { readFileSync } from 'node:fs';
import * as github from '@actions/github';
import { runAction } from '../utils/action.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger } from '../utils/logger.js';
import { MARKER, parseReport, renderReport } from './render.js';

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
  const body = renderReport(report, owner + '/' + repo, github.context.runId);
  const result = existing
    ? await api.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body })
    : await api.rest.issues.createComment({ owner, repo, issue_number: pull_number, body });
  setOutputs({ 'comment-url': result.data.html_url });
});
