import * as core from '@actions/core';
import * as github from '@actions/github';

function csv(value: string): string[] {
  return value.split(/[\\n,]/).map(item => item.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const head = core.getInput('head', { required: true });
  const base = core.getInput('base') || github.context.payload.repository?.default_branch || 'main';
  const title = core.getInput('title', { required: true });
  const draft = core.getBooleanInput('draft');
  const updateExisting = core.getBooleanInput('update-existing');
  const conversationUrl = core.getInput('conversation-url');
  let body = core.getInput('body');
  if (conversationUrl && !body.includes(conversationUrl)) body = `${body.trim()}\\n\\n## 💬 Conversation\\n${conversationUrl}`.trim();
  const existing = await octokit.paginate(octokit.rest.pulls.list, { owner, repo, state: 'open', head: `${owner}:${head}`, base, per_page: 100 });
  let pull = existing[0];
  let created = false;
  if (pull) {
    if (!updateExisting) throw new Error(`PR #${pull.number} already exists for ${head} → ${base}`);
    const response = await octokit.rest.pulls.update({ owner, repo, pull_number: pull.number, title, body, ...(core.getInput('maintainer-can-modify') ? { maintainer_can_modify: core.getBooleanInput('maintainer-can-modify') } : {}) });
    pull = response.data;
  } else {
    const response = await octokit.rest.pulls.create({ owner, repo, head, base, title, body, draft });
    pull = response.data;
    created = true;
  }
  const labels = csv(core.getInput('labels'));
  const reviewers = csv(core.getInput('reviewers'));
  if (labels.length) await octokit.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels });
  if (reviewers.length) await octokit.rest.pulls.requestReviewers({ owner, repo, pull_number: pull.number, reviewers });
  core.setOutput('number', String(pull.number));
  core.setOutput('url', pull.html_url);
  core.setOutput('created', String(created));
  core.setOutput('updated', String(!created));
  await core.summary.addHeading('🤖 Pull request ready')
    .addTable([[{ data: 'PR', header: true }, { data: 'Base', header: true }, { data: 'Result', header: true }], [`[#${pull.number}](${pull.html_url})`, base, created ? 'Created' : 'Updated']])
    .write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
