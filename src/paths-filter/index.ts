import * as core from '@actions/core';
import * as github from '@actions/github';
import { matchChangedFiles, selectFilters } from './rules.js';

async function main(): Promise<void> {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;
  const [configOwner, configRepo] = core.getInput('config-repository').split('/');
  if (!configOwner || !configRepo) throw new Error('Invalid config-repository');
  const config = await octokit.rest.repos.getContent({
    owner: configOwner, repo: configRepo,
    path: core.getInput('config-path'),
    ref: core.getInput('config-ref'),
  });
  if (Array.isArray(config.data) || !('content' in config.data) || !config.data.content) {
    throw new Error('Central config must be a file');
  }
  const yaml = Buffer.from(config.data.content, 'base64').toString('utf8');
  const filters = selectFilters(yaml, core.getInput('repository-key') || repo);
  let files: string[];
  let fullRun = false;
  if (github.context.eventName === 'pull_request' || github.context.eventName === 'pull_request_target') {
    const number = github.context.payload.pull_request?.number;
    if (!number) throw new Error('Missing pull request number');
    const changes = await octokit.paginate(octokit.rest.pulls.listFiles, { owner, repo, pull_number: number, per_page: 100 });
    if (changes.length >= 3000) throw new Error('PR file listing reached GitHub API limit; refusing incomplete filter');
    files = changes.flatMap(f => f.previous_filename ? [f.filename, f.previous_filename] : [f.filename]);
  } else if (github.context.eventName === 'push') {
    const before = core.getInput('base') || github.context.payload.before;
    const after = github.context.sha;
    if (!before || /^0+$/.test(before)) {
      fullRun = true;
      files = [];
    } else {
      const result = await octokit.rest.repos.compareCommitsWithBasehead({ owner, repo, basehead: `${before}...${after}`, per_page: 100 });
      if ((result.data.total_commits ?? 0) > 250 || (result.data.files?.length ?? 0) >= 300) {
        throw new Error('Commit comparison may be truncated; refusing incomplete filter');
      }
      files = (result.data.files ?? []).flatMap(f => f.previous_filename ? [f.filename, f.previous_filename] : [f.filename]);
    }
  } else {
    throw new Error(`Unsupported event ${github.context.eventName}; use a dedicated dispatch policy`);
  }
  files = [...new Set(files)];
  const changes = fullRun ? Object.keys(filters) : matchChangedFiles(files, filters);
  core.setOutput('files', JSON.stringify(files));
  core.setOutput('changes', JSON.stringify(changes));
  core.setOutput('any', String(changes.length > 0));
  core.setOutput('full-run', String(fullRun));
  await core.summary.addHeading('🧬 Central paths filter').addTable([
    [{ data: 'Repository', header: true }, { data: 'Changed files', header: true }, { data: 'Matched filters', header: true }],
    [`${owner}/${repo}`, String(files.length), fullRun ? 'Initial push · all filters' : changes.join(', ') || 'None'],
  ]).write();
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
