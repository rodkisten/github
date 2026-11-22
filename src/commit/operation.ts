import { commitViaGitDatabase, type Octokit } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import type { FileChange } from './validate.js';

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

export async function createAtomicCommit(
  octokit: Octokit,
  options: AtomicCommitOptions
): Promise<AtomicCommitResult> {
  const { owner, repo, branch, base, message, files, authorName, authorEmail } = options;

  return logger.step(`Create atomic commit on ${branch}`, async () => {
    const result = await commitViaGitDatabase(octokit, {
      owner,
      repo,
      branch,
      base,
      message,
      authorName,
      authorEmail,
      files,
      createBranchIfMissing: true,
    });

    return {
      sha: result.sha,
      branch: result.branch,
      files: result.filesCount,
    };
  });
}
