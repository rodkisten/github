/**
 * 🏷️ semantic-release publish plugin.
 * Updates vMAJOR only after a successful semantic release.
 * Uses the GitHub REST API through @actions/github.
 */
module.exports.publish = async (_pluginConfig, context) => {
  const { nextRelease, logger, env } = context;
  if (!nextRelease?.version) return;
  const match = /^([0-9]+)\./.exec(nextRelease.version);
  if (!match) throw new Error('Invalid semantic version');
  const majorTag = `v${match[1]}`;
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const repository = env.GITHUB_REPOSITORY;
  if (!repository?.includes('/')) throw new Error('GITHUB_REPOSITORY is required');
  const [owner, repo] = repository.split('/');
  const { getOctokit } = await import('@actions/github');
  const octokit = getOctokit(token);
  const exactTag = await octokit.rest.git.getRef({ owner, repo, ref: `tags/${nextRelease.gitTag}` });
  const sha = exactTag.data.object.sha;
  try {
    await octokit.rest.git.getRef({ owner, repo, ref: `tags/${majorTag}` });
    await octokit.rest.git.updateRef({ owner, repo, ref: `tags/${majorTag}`, sha, force: true });
    logger.log('Updated %s → %s', majorTag, nextRelease.gitTag);
  } catch (error) {
    if (error?.status !== 404) throw error;
    await octokit.rest.git.createRef({ owner, repo, ref: `refs/tags/${majorTag}`, sha });
    logger.log('Created %s → %s', majorTag, nextRelease.gitTag);
  }
};
