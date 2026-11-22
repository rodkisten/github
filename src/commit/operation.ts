import type { getOctokit } from '@actions/github';
import { logger, style } from '../utils/logger.js';
import type { FileChange } from './validate.js';

type Octokit = ReturnType<typeof getOctokit>;

export interface AtomicCommitOptions {
  owner: string;
  repo: string;
  branch: string;
  base: string;
  message: string;
  files: FileChange[];
  authorName: string;
  authorEmail: string;
}

export interface AtomicCommitResult {
  sha: string;
  branch: string;
  files: number;
}

async function resolveTargetBranchSha(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  base: string
): Promise<string> {
  const baseRef = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${base}`,
  });

  try {
    const targetRef = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    logger.item('Target branch', `${branch} (existing)`, true);
    return targetRef.data.object.sha;
  } catch (error) {
    if ((error as { status?: number }).status !== 404) {
      throw error;
    }

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseRef.data.object.sha,
    });
    logger.item('Target branch', `${branch} (created from ${base})`, true);
    return baseRef.data.object.sha;
  }
}

export async function createAtomicCommit(
  octokit: Octokit,
  options: AtomicCommitOptions
): Promise<AtomicCommitResult> {
  const { owner, repo, branch, base, message, files, authorName, authorEmail } = options;

  return logger.step(`Create atomic commit on ${branch}`, async () => {
    const parentSha = await logger.spin(`Resolving branch "${branch}" from "${base}"`, () =>
      resolveTargetBranchSha(octokit, owner, repo, branch, base)
    );

    const parent = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: parentSha,
    });

    const blobs = await logger.spin(`Creating ${files.length} Git blob(s)`, () =>
      Promise.all(
        files.map((file) =>
          octokit.rest.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: file.encoding === 'base64' ? 'base64' : 'utf-8',
          })
        )
      )
    );

    const tree = await logger.spin('Building Git tree', () =>
      octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: parent.data.tree.sha,
        tree: files.map((file, index) => ({
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blobs[index].data.sha,
        })),
      })
    );

    const commit = await logger.spin('Writing commit object', () =>
      octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.data.sha,
        parents: [parentSha],
        author: { name: authorName, email: authorEmail },
        committer: { name: authorName, email: authorEmail },
      })
    );

    await logger.spin(`Updating ref heads/${branch}`, () =>
      octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commit.data.sha,
        force: false,
      })
    );

    logger.item('Commit SHA', style.bold(commit.data.sha.slice(0, 7)));
    logger.item('Files committed', files.length, true);

    return {
      sha: commit.data.sha,
      branch,
      files: files.length,
    };
  });
}
