import { runAction } from '../utils/action.js';
import { appendConversationUrl } from './helpers.js';
import { createOrUpdatePullRequest } from './operation.js';

runAction('Create or Update PR', async ({ utils, logger, style, summary, octoKit: github }) => {
  const { getInputs, setOutputs } = utils;
  const { owner, repo } = github.context.repo;

  logger.banner('Create or Update PR', `${owner}/${repo}`);

  const inputs = await logger.step('Validate PR inputs', () => {
    const parsed = getInputs({
      token: { required: true, secret: true },
      head: { required: true },
      base: { default: github.context.payload.repository?.default_branch || 'main' },
      title: { required: true },
      body: { default: '' },
      draft: { type: 'boolean', default: false },
      'update-existing': { type: 'boolean', default: true },
      'conversation-url': { default: '' },
      labels: { type: 'list' },
      reviewers: { type: 'list' },
    });

    logger.item('Head', parsed.head);
    logger.item('Base', parsed.base);
    logger.item('Draft', parsed.draft);
    logger.item('Update existing', parsed['update-existing'], true);

    return parsed;
  });

  const octokit = github.getOctokit(inputs.token);
  const result = await createOrUpdatePullRequest(octokit, {
    owner,
    repo,
    head: inputs.head,
    base: inputs.base,
    title: inputs.title,
    body: appendConversationUrl(inputs.body, inputs['conversation-url']),
    draft: inputs.draft,
    updateExisting: inputs['update-existing'],
    labels: inputs.labels,
    reviewers: inputs.reviewers,
  });

  logger.divider('Outputs & Summary');

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
          Base: inputs.base,
          Result: result.created ? 'Created' : 'Updated',
        },
      ],
    },
  ]);

  logger.success(
    `Pull request #${result.number} ${result.created ? 'created' : 'updated'}: ${style.bold(result.url)}`
  );
  logger.divider('', '═');
});
