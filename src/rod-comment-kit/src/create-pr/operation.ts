import type { Octokit } from '../utils/git.js';
import { logger, style } from '../utils/logger.js';

export type PullRequestOptions = {
  owner: string;
  repo: string;
  head: string;
  base: string;
  title: string;
  body: string;
  draft: boolean;
  updateExisting: boolean;
  labels: string[];
  reviewers: string[];
};

export async function createOrUpdatePullRequest(octokit: Octokit, options: PullRequestOptions) {
  const { owner, repo, head, base, title, body, draft, updateExisting, labels, reviewers } =
    options;

  return logger.step(`Sync Pull Request (${head} → ${base})`, async () => {
    const existing = await logger.spin('Checking for existing open pull requests', () =>
      octokit.paginate(octokit.rest.pulls.list, {
        owner,
        repo,
        state: 'open',
        head: head.includes(':') ? head : `${owner}:${head}`,
        base,
        per_page: 100,
      })
    );

    let number: number;
    let url: string;
    let created = false;

    if (existing[0]) {
      if (!updateExisting) {
        throw new Error(`PR #${existing[0].number} already exists for ${head} → ${base}`);
      }
      const response = await logger.spin(`Updating existing PR #${existing[0].number}`, () =>
        octokit.rest.pulls.update({
          owner,
          repo,
          pull_number: existing[0].number,
          title,
          body,
        })
      );
      number = response.data.number;
      url = response.data.html_url;
    } else {
      const response = await logger.spin('Creating new pull request', () =>
        octokit.rest.pulls.create({
          owner,
          repo,
          head,
          base,
          title,
          body,
          draft,
        })
      );
      number = response.data.number;
      url = response.data.html_url;
      created = true;
    }

    if (labels.length) {
      await logger.spin(`Applying ${labels.length} label(s)`, () =>
        octokit.rest.issues.addLabels({ owner, repo, issue_number: number, labels })
      );
    }

    if (reviewers.length) {
      await logger.spin(`Requesting ${reviewers.length} reviewer(s)`, () =>
        octokit.rest.pulls.requestReviewers({ owner, repo, pull_number: number, reviewers })
      );
    }

    logger.item('PR Number', `#${number}`);
    logger.item('Action', created ? style.green('Created') : style.cyan('Updated'));
    logger.item('URL', url, true);

    return { number, url, created, updated: !created };
  });
}
