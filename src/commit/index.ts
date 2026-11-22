import { readFileSync } from 'node:fs';
import * as github from '@actions/github';
import { runAction } from '../utils/action.js';
import { validateBranchName } from '../utils/git.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import { createAtomicCommit } from './operation.js';
import { validateChanges, type FileChange } from './validate.js';

runAction('App-Authored Commit', async () => {
  const { owner, repo } = github.context.repo;

  logger.banner('App-Authored Commit', `${owner}/${repo}`);

  const inputs = await logger.step('Validate inputs & file changes', () => {
    const parsed = getInputs({
      token: { required: true, secret: true },
      branch: { required: true },
      base: { default: github.context.payload.repository?.default_branch || 'main' },
      message: { required: true },
      files: { default: '' },
      'files-path': { default: '' },
      'author-name': { default: 'Rod GitHub App' },
      'author-email': { default: 'github-actions[bot]@users.noreply.github.com' },
    });

    validateBranchName(parsed.branch);
    validateBranchName(parsed.base);

    const rawJson = parsed['files-path']
      ? readFileSync(parsed['files-path'], 'utf8')
      : parsed.files;

    if (!rawJson) {
      throw new Error('Either "files" or "files-path" input is required');
    }

    const fileChanges = JSON.parse(rawJson) as FileChange[];
    validateChanges(fileChanges);

    logger.item('Target branch', parsed.branch);
    logger.item('Base branch', parsed.base);
    logger.item('Author', `${parsed['author-name']} <${parsed['author-email']}>`);
    logger.item('Files to commit', fileChanges.length, true);

    return { ...parsed, fileChanges };
  });

  const octokit = github.getOctokit(inputs.token);

  const result = await createAtomicCommit(octokit, {
    owner,
    repo,
    branch: inputs.branch,
    base: inputs.base,
    message: inputs.message,
    files: inputs.fileChanges,
    authorName: inputs['author-name'],
    authorEmail: inputs['author-email'],
  });

  logger.divider('Outputs & Job Summary');

  setOutputs({
    sha: result.sha,
    branch: inputs.branch,
    files: result.files,
  });

  await summary.publish('📝 App-authored commit', [
    {
      table: [
        {
          Branch: inputs.branch,
          Commit: result.sha,
          Files: result.files,
        },
      ],
    },
  ]);

  logger.success(`Committed ${result.files} file(s) to ${style.bold(inputs.branch)}`);
  logger.divider('', '═');
});
