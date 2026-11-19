import * as core from '@actions/core';
import * as github from '@actions/github';

type FileChange = { path: string; content: string; encoding?: 'utf-8' | 'base64' };

async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const branch = core.getInput('branch', { required: true });
  const base = core.getInput('base') || github.context.payload.repository?.default_branch || 'main';
  const message = core.getInput('message', { required: true });
  const changes = JSON.parse(core.getInput('files', { required: true })) as FileChange[];
  if (!Array.isArray(changes) || changes.length === 0) throw new Error('files must be a non-empty JSON array');
  const seen = new Set<string>();
  for (const file of changes) {
    if (!file.path || file.path.startsWith('/') || file.path.split('/').includes('..')) throw new Error(`Unsafe file path: ${file.path}`);
    if (seen.has(file.path)) throw new Error(`Duplicate file path: ${file.path}`);
    seen.add(file.path);
    if (typeof file.content !== 'string') throw new Error(`Missing content for ${file.path}`);
  }

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
  const tree = await octokit.rest.git.createTree({
    owner, repo, base_tree: parent.data.tree.sha,
    tree: changes.map(file => ({
      path: file.path, mode: '100644' as const, type: 'blob' as const,
      content: file.encoding === 'base64' ? undefined : file.content,
      ...(file.encoding === 'base64' ? { sha: undefined, content: Buffer.from(file.content, 'base64').toString('utf8') } : {}),
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
