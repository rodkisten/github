import * as github from '@actions/github';
import Handlebars from 'handlebars';
import { createOrUpdatePullRequest } from '../create-pr/operation.js';
import { runAction } from '../utils/action.js';
import {
  commitViaGitDatabase,
  listWorkspaceChanges,
  validateBranchName,
} from '../utils/git.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';

function registerHelpers() {
  Handlebars.registerHelper('upper', (value: unknown) => String(value ?? '').toUpperCase());
  Handlebars.registerHelper('lower', (value: unknown) => String(value ?? '').toLowerCase());
  Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value, null, 2));
  Handlebars.registerHelper('default', (value: unknown, fallback: unknown) => value || fallback);
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('date', (value?: string | number, format?: string) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) throw new Error('Invalid date passed to {{date}}');
    return format === 'iso' ? date.toISOString() : date.toISOString().slice(0, 10);
  });
}

function render(template: string, context: Record<string, unknown>, label: string): string {
  try {
    return Handlebars.compile(template, { noEscape: true, strict: true })(context).trim();
  } catch (error) {
    throw new Error(
      `Cannot render ${label}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

runAction('Publish Git Changes', async () => {
  registerHelpers();

  const context = github.context;
  const { owner, repo } = context.repo;
  if (!owner || !repo) {
    throw new Error('Cannot resolve repository from GitHub context');
  }

  logger.banner('Publish Git Changes', `${owner}/${repo}`);

  const payload = context.payload as Record<string, any>;

  const inputs = await logger.step('Validate publish configuration', () => {
    const parsed = getInputs({
      token: { required: true, secret: true },
      mode: {
        required: true,
        parse: (raw) => {
          if (raw !== 'commit' && raw !== 'pull-request') {
            throw new Error('mode must be commit or pull-request');
          }
          return raw;
        },
      },
      branch: { default: '' },
      'base-branch': { default: payload.repository?.default_branch || 'main' },
      'commit-message': { default: '' },
      'commit-message-template': { default: '' },
      'pr-title': { default: '' },
      'pr-title-template': { default: '' },
      'pr-body': { default: '' },
      'pr-body-template': { default: '' },
      'template-data': {
        default: {} as Record<string, unknown>,
        parse: (raw) => {
          if (!raw) return {};
          let custom: unknown;
          try {
            custom = JSON.parse(raw);
          } catch {
            throw new Error('template-data must be a valid JSON object');
          }
          if (!custom || Array.isArray(custom) || typeof custom !== 'object') {
            throw new Error('template-data must be a JSON object');
          }
          return custom as Record<string, unknown>;
        },
      },
      labels: { type: 'list' },
      draft: { type: 'boolean', default: false },
      'author-name': { default: context.actor || 'Rod GitHub App' },
      'author-email': {
        default: `${context.actor || 'github-actions[bot]'}@users.noreply.github.com`,
      },
    });

    const targetBranch =
      parsed.mode === 'commit'
        ? parsed.branch || context.ref.replace(/^refs\/heads\//, '')
        : parsed.branch ||
          `automation/${context.workflow.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    validateBranchName(targetBranch);
    validateBranchName(parsed['base-branch']);

    logger.item('Mode', parsed.mode);
    logger.item('Target branch', targetBranch);
    logger.item('Base branch', parsed['base-branch'], true);

    return { ...parsed, targetBranch };
  });

  const paths = await logger.step('Inspect workspace changes', () => {
    const changed = listWorkspaceChanges('HEAD');
    if (changed.length === 0) {
      throw new Error('There are no changed or untracked files to publish');
    }
    logger.item('Changed/untracked files', changed.length, true);
    return changed;
  });

  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
  const templateContext: Record<string, unknown> = {
    repository: `${owner}/${repo}`,
    owner,
    repo,
    branch: inputs.targetBranch,
    baseBranch: inputs['base-branch'],
    sha: context.sha,
    shortSha: context.sha.slice(0, 7),
    actor: context.actor,
    workflow: context.workflow,
    runId: context.runId,
    runNumber: context.runNumber,
    runUrl,
    eventName: context.eventName,
    ref: context.ref,
    refName: context.ref.replace(/^refs\/(heads|tags)\//, ''),
    prNumber: payload.pull_request?.number ?? null,
    timestamp: new Date().toISOString(),
    files: paths,
    fileCount: paths.length,
    inputs: (payload.inputs as Record<string, unknown> | undefined) ?? {},
    ...inputs['template-data'],
  };

  const messageTemplate =
    inputs['commit-message-template'] ||
    inputs['commit-message'] ||
    'chore: automated update';
  const commitMessage = render(messageTemplate, templateContext, 'commit message');
  if (!commitMessage) {
    throw new Error('Rendered commit message cannot be empty');
  }

  const octokit = github.getOctokit(inputs.token);

  const commitResult = await logger.step(
    `Commit ${paths.length} file(s) to ${inputs.targetBranch}`,
    () =>
      commitViaGitDatabase(octokit, {
        owner,
        repo,
        branch: inputs.targetBranch,
        base: inputs['base-branch'],
        message: commitMessage,
        authorName: inputs['author-name'],
        authorEmail: inputs['author-email'],
        workspacePaths: paths,
        createBranchIfMissing: inputs.mode === 'pull-request',
      })
  );

  setOutputs({
    'commit-sha': commitResult.sha,
    branch: inputs.targetBranch,
    files: paths.join('\n'),
  });

  if (inputs.mode === 'commit') {
    setOutputs({ 'pr-number': '', 'pr-url': '' });

    await summary.publish('📤 Published direct commit', [
      {
        table: [
          {
            Branch: inputs.targetBranch,
            Commit: commitResult.sha.slice(0, 7),
            Files: paths.length,
          },
        ],
      },
    ]);

    logger.success(
      `Published ${paths.length} file(s) to ${style.bold(`${owner}/${repo}@${inputs.targetBranch}`)}`
    );
    logger.divider('', '═');
    return;
  }

  const titleTemplate =
    inputs['pr-title-template'] || inputs['pr-title'] || 'chore: automated update';
  const bodyTemplate =
    inputs['pr-body-template'] ||
    inputs['pr-body'] ||
    [
      '## Summary',
      '',
      'Automated changes published by **{{workflow}}**.',
      '',
      '- Repository: `{{repository}}`',
      '- Commit: `{{shortSha}}`',
      '- Files changed: {{fileCount}}',
      '- Source: [workflow run]({{runUrl}})',
      '',
      '### Changed files',
      '{{#each files}}- `{{this}}`',
      '{{/each}}',
    ].join('\n');

  const prTitle = render(titleTemplate, templateContext, 'pull request title');
  const prBody = render(bodyTemplate, templateContext, 'pull request body');
  if (!prTitle) {
    throw new Error('Rendered pull request title cannot be empty');
  }

  const pr = await createOrUpdatePullRequest(octokit, {
    owner,
    repo,
    head: inputs.targetBranch,
    base: inputs['base-branch'],
    title: prTitle,
    body: prBody,
    draft: inputs.draft,
    updateExisting: true,
    labels: inputs.labels,
    reviewers: [],
  });

  setOutputs({
    'pr-number': pr.number,
    'pr-url': pr.url,
  });

  await summary.publish('📤 Published pull request', [
    {
      table: [
        {
          PR: `[#${pr.number}](${pr.url})`,
          Branch: inputs.targetBranch,
          Commit: commitResult.sha.slice(0, 7),
          Files: paths.length,
        },
      ],
    },
  ]);

  logger.success(`Pull request #${pr.number} ready: ${style.bold(pr.url)}`);
  logger.divider('', '═');
});
