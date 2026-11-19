import * as core from '@actions/core';
import * as github from '@actions/github';
import { validateBranchName, validateChanges, type FileChange } from './validate.js';

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
  const changes = JSON.parse(core.getInput('files', { required: true })) as FileChange[];
  validateChanges(changes);

  const baseRef = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${base}` });
  let parentSha: string;
  try {
    parentSha = (await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` })).data.object.sha;
  } catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseRef.data.object.sha });
    parentSha = baseRef.data.object.sha;
  }
  const parent = await octokit.rest.git.getCommit({ owner, repo, commit_sha: parentSha });
  const blobs = await Promise.all(changes.map(file => octokit.rest.git.createBlob({
    owner, repo,
    content: file.content,
    encoding: file.encoding === 'base64' ? 'base64' : 'utf-8',
  })));
  const tree = await octokit.rest.git.createTree({
    owner, repo, base_tree: parent.data.tree.sha,
    tree: changes.map((file, index) => ({
      path: file.path, mode: '100644' as const, type: 'blob' as const,
      sha: blobs[index].data.sha,
    })),
  });
  const commit = await octokit.rest.git.createCommit({
    owner, repo, message, tree: tree.data.sha, parents: [parentSha],
    author: { name: core.getInput('author-name') || 'Rod GitHub App', email: core.getInput('author-email') || 'github-actions[bot]@users.noreply.github.com' },
    committer: { name: core.getInput('author-name') || 'Rod GitHub App', email: core.getInput('author-email') || 'github-actions[bot]@users.noreply.github.com' },
  });
  await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha, force: false });
  core.setOutput('sha', commit.data.sha);
  core.setOutput('branch', branch);
  core.setOutput('files', String(changes.length));
  await core.summary.addHeading('📝 App-authored commit')
    .addTable([[{ data: 'Branch', header: true }, { data: 'Commit', header: true }, { data: 'Files', header: true }], [branch, commit.data.sha, String(changes.length)]])
    .write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
