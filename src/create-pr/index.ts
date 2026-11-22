import * as core from '@actions/core';
import * as github from '@actions/github';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { appendConversationUrl } from './helpers.js';
import { createOrUpdatePullRequest } from './operation.js';

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;

  // Tudo tipado e validado em uma única chamada (inclusive nomes com hífen!)
  const {
    token,
    head,
    base,
    title,
    body,
    draft,
    'update-existing': updateExisting,
    'conversation-url': conversationUrl,
    labels,
    reviewers,
  } = getInputs({
    token: { required: true, secret: true },
    head: { required: true },
    base: { default: github.context.payload.repository?.default_branch || 'main' },
    title: { required: true },
    body: { default: '' },
    draft: { type: 'boolean', default: false },
    'update-existing': { type: 'boolean', default: false },
    'conversation-url': { default: '' },
    labels: { type: 'list' },
    reviewers: { type: 'list' },
  });

  const octokit = github.getOctokit(token);
  const result = await createOrUpdatePullRequest(octokit, {
    owner,
    repo,
    head,
    base,
    title,
    body: appendConversationUrl(body, conversationUrl),
    draft,
    updateExisting,
    labels,
    reviewers,
  });

  // Todos os outputs exportados em uma linha
  setOutputs({
    number: result.number,
    url: result.url,
    created: result.created,
    updated: result.updated,
  });

  await summary.publish('🤖 Pull request ready', [
    {
      table: [
        {
          PR: `[#${result.number}](${result.url})`,
          Base: base,
          Result: result.created ? 'Created' : 'Updated',
        },
      ],
    },
  ]);
}
