import { readFileSync } from 'node:fs';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { logger, style } from '../utils/logger.js';
import { createAtomicCommit } from './operation.js';
import { validateBranchName, validateChanges, type FileChange } from './validate.js';

interface CommitActionInputs {
  token: string;
  branch: string;
  base: string;
  message: string;
  files: FileChange[];
  authorName: string;
  authorEmail: string;
}

function parseFilesInput(): FileChange[] {
  const filesPath = core.getInput('files-path');
  const rawJson = filesPath
    ? readFileSync(filesPath, 'utf8')
    : core.getInput('files', { required: true });

  return JSON.parse(rawJson) as FileChange[];
}

function getInputs(): CommitActionInputs {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);

  const branch = core.getInput('branch', { required: true });
  const base =
    core.getInput('base') || github.context.payload.repository?.default_branch || 'main';

  validateBranchName(branch);
  validateBranchName(base);

  const message = core.getInput('message', { required: true });
  const files = parseFilesInput();
  validateChanges(files);

  return {
    token,
    branch,
    base,
    message,
    files,
    authorName: core.getInput('author-name') || 'Rod GitHub App',
    authorEmail: core.getInput('author-email') || 'github-actions[bot]@users.noreply.github.com',
  };
}

async function writeSummary(branch: string, sha: string, filesCount: number): Promise<void> {
  await core.summary
    .addHeading('📝 App-authored commit')
    .addTable([
      [
        { data: 'Branch', header: true },
        { data: 'Commit', header: true },
        { data: 'Files', header: true },
      ],
      [branch, sha, String(filesCount)],
    ])
    .write();
}

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;

  logger.banner('App-Authored Commit', `${owner}/${repo}`);

  const inputs = await logger.step('Validate inputs & file changes', () => {
    const parsed = getInputs();
    logger.item('Target branch', parsed.branch);
    logger.item('Base branch', parsed.base);
    logger.item('Author', `${parsed.authorName} <${parsed.authorEmail}>`);
    logger.item('Files to commit', parsed.files.length, true);
    return parsed;
  });

  const octokit = github.getOctokit(inputs.token);

  const result = await createAtomicCommit(octokit, {
    owner,
    repo,
    branch: inputs.branch,
    base: inputs.base,
    message: inputs.message,
    files: inputs.files,
    authorName: inputs.authorName,
    authorEmail: inputs.authorEmail,
  });

  logger.divider('Outputs & Job Summary');

  core.setOutput('sha', result.sha);
  core.setOutput('branch', inputs.branch);
  core.setOutput('files', String(result.files));

  await writeSummary(inputs.branch, result.sha, result.files);

  logger.success(`Committed ${result.files} file(s) to ${style.bold(inputs.branch)}`);
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'App-Authored Commit');
  core.setFailed(message);
});
