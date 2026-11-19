import * as core from '@actions/core';
import * as github from '@actions/github';
import { appendConversationUrl, parseList } from './helpers.js';
import { createOrUpdatePullRequest } from './operation.js';

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
  const body = appendConversationUrl(core.getInput('body'), conversationUrl);
  const result = await createOrUpdatePullRequest(octokit, {
    owner, repo, head, base, title, body, draft, updateExisting,
    labels: parseList(core.getInput('labels')),
    reviewers: parseList(core.getInput('reviewers')),
  });
  core.setOutput('number', String(result.number));
  core.setOutput('url', result.url);
  core.setOutput('created', String(result.created));
  core.setOutput('updated', String(result.updated));
  await core.summary.addHeading('🤖 Pull request ready')
    .addTable([[{ data: 'PR', header: true }, { data: 'Base', header: true }, { data: 'Result', header: true }], [`[#${result.number}](${result.url})`, base, result.created ? 'Created' : 'Updated']])
    .write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
