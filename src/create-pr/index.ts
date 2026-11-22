import * as core from '@actions/core';
import * as github from '@actions/github';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { appendConversationUrl, parseList } from './helpers.js';
import { createOrUpdatePullRequest } from './operation.js';

interface PullRequestInputs {
  token: string;
  head: string;
  base: string;
  title: string;
  body: string;
  draft: boolean;
  updateExisting: boolean;
  labels: string[];
  reviewers: string[];
}

function getInputs(): PullRequestInputs {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);

  const head = core.getInput('head', { required: true });
  const base =
    core.getInput('base') || github.context.payload.repository?.default_branch || 'main';
  const title = core.getInput('title', { required: true });
  const draft = core.getBooleanInput('draft');
  const updateExisting = core.getBooleanInput('update-existing');
  const conversationUrl = core.getInput('conversation-url');
  const body = appendConversationUrl(core.getInput('body'), conversationUrl);

  return {
    token,
    head,
    base,
    title,
    body,
    draft,
    updateExisting,
    labels: parseList(core.getInput('labels')),
    reviewers: parseList(core.getInput('reviewers')),
  };
}

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;

  logger.banner('Pull Request Automation', `${owner}/${repo}`);

  const inputs = await logger.step('Load Pull Request inputs', () => {
    const parsed = getInputs();
    logger.item('Branches', `${parsed.head} → ${parsed.base}`);
    logger.item('Title', parsed.title);
    logger.item('Draft', parsed.draft);
    logger.item('Update existing', parsed.updateExisting);
    logger.item('Labels', parsed.labels.length > 0 ? parsed.labels.join(', ') : 'none');
    logger.item(
      'Reviewers',
      parsed.reviewers.length > 0 ? parsed.reviewers.join(', ') : 'none',
      true
    );
    return parsed;
  });

  const octokit = github.getOctokit(inputs.token);

  const result = await logger.step('Create or update Pull Request', async () => {
    const prResult = await logger.spin(
      `Syncing PR (${inputs.head} → ${inputs.base})`,
      () =>
        createOrUpdatePullRequest(octokit, {
          owner,
          repo,
          head: inputs.head,
          base: inputs.base,
          title: inputs.title,
          body: inputs.body,
          draft: inputs.draft,
          updateExisting: inputs.updateExisting,
          labels: inputs.labels,
          reviewers: inputs.reviewers,
        })
    );

    const actionLabel = prResult.created ? 'Created' : 'Updated';
    logger.item('PR Number', `#${prResult.number}`);
    logger.item('Action', actionLabel);
    logger.item('URL', prResult.url, true);

    return prResult;
  });

  logger.divider('Outputs & Job Summary');

  core.setOutput('number', String(result.number));
  core.setOutput('url', result.url);
  core.setOutput('created', String(result.created));
  core.setOutput('updated', String(result.updated));

  await summary.publish('🤖 Pull request ready', [
    {
      table: [
        {
          PR: `[#${result.number}](${result.url})`,
          Base: inputs.base,
          Result: result.created ? 'Created' : 'Updated',
        },
      ],
    },
  ]);

  logger.success(
    `Pull Request #${result.number} ${result.created ? 'created' : 'updated'} (${style.bold(result.url)})`
  );
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'Pull Request Automation');
  core.setFailed(message);
});
