import type { getOctokit } from '@actions/github';
import type { FileChange } from './validate.js';

type Octokit = ReturnType<typeof getOctokit>;
export async function createAtomicCommit(
  octokit: Octokit,
  options: { owner: string; repo: string; branch: string; base: string; message: string; files: FileChange[]; authorName: string; authorEmail: string },
) {
  const { owner, repo, branch, base, message, files, authorName, authorEmail } = options;
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
  const blobs = await Promise.all(files.map(file => octokit.rest.git.createBlob({
    owner, repo, content: file.content, encoding: file.encoding === 'base64' ? 'base64' : 'utf-8',
  })));
  const tree = await octokit.rest.git.createTree({
    owner, repo, base_tree: parent.data.tree.sha,
    tree: files.map((file, index) => ({ path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blobs[index].data.sha })),
  });
  const commit = await octokit.rest.git.createCommit({
    owner, repo, message, tree: tree.data.sha, parents: [parentSha],
    author: { name: authorName, email: authorEmail },
    committer: { name: authorName, email: authorEmail },
  });
  await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha, force: false });
  return { sha: commit.data.sha, branch, files: files.length };
}
