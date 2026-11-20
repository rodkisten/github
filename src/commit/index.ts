import * as core from '@actions/core';
import * as github from '@actions/github';
import { readFileSync } from 'node:fs';
import { validateBranchName, validateChanges, type FileChange } from './validate.js';
import { createAtomicCommit } from './operation.js';

async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const branch = core.getInput('branch', { required: true });
  const base = core.getInput('base') || github.context.payload.repository?.default_branch || 'main';
  validateBranchName(branch);
  validateBranchName(base);
  const message = core.getInput('message', { required: true });
  const filesPath = core.getInput('files-path');
  const changes = JSON.parse(filesPath ? readFileSync(filesPath, 'utf8') : core.getInput('files', { required: true })) as FileChange[];
  validateChanges(changes);

  const result = await createAtomicCommit(octokit, {
    owner, repo, branch, base, message, files: changes,
    authorName: core.getInput('author-name') || 'Rod GitHub App',
    authorEmail: core.getInput('author-email') || 'github-actions[bot]@users.noreply.github.com',
  });
  core.setOutput('sha', result.sha);
  core.setOutput('branch', branch);
  core.setOutput('files', String(result.files));
  await core.summary.addHeading('📝 App-authored commit')
    .addTable([[{ data: 'Branch', header: true }, { data: 'Commit', header: true }, { data: 'Files', header: true }], [branch, result.sha, String(result.files)]])
    .write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
