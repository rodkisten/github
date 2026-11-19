import type { getOctokit } from '@actions/github';

type Octokit = ReturnType<typeof getOctokit>;
export type PullRequestOptions = {
  owner: string; repo: string; head: string; base: string; title: string;
  body: string; draft: boolean; updateExisting: boolean;
  labels: string[]; reviewers: string[];
};
export async function createOrUpdatePullRequest(octokit: Octokit, options: PullRequestOptions) {
  const { owner, repo, head, base, title, body, draft, updateExisting, labels, reviewers } = options;
  const existing = await octokit.paginate(octokit.rest.pulls.list, {
    owner, repo, state: 'open', head: `${owner}:${head}`, base, per_page: 100,
  });
  let number: number;
  let url: string;
  let created = false;
  if (existing[0]) {
    if (!updateExisting) throw new Error(`PR #${existing[0].number} already exists for ${head} → ${base}`);
    const response = await octokit.rest.pulls.update({ owner, repo, pull_number: existing[0].number, title, body });
    number = response.data.number;
    url = response.data.html_url;
  } else {
    const response = await octokit.rest.pulls.create({ owner, repo, head, base, title, body, draft });
    number = response.data.number;
    url = response.data.html_url;
    created = true;
  }
  if (labels.length) await octokit.rest.issues.addLabels({ owner, repo, issue_number: number, labels });
  if (reviewers.length) await octokit.rest.pulls.requestReviewers({ owner, repo, pull_number: number, reviewers });
  return { number, url, created, updated: !created };
}
