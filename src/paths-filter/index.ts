import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  buildFilterMatrix,
  FilterMatrixDefaults,
  resolveMatchedFilters,
  selectFilters,
} from './rules.js';

type Octokit = ReturnType<typeof github.getOctokit>;

interface ActionInputs {
  token: string;
  configOwner: string;
  configRepo: string;
  configPath: string;
  configRef: string;
  repositoryKey: string;
  base: string;
  matrixDefaults: FilterMatrixDefaults;
}

function getInputs(defaultRepo: string): ActionInputs {
  const token = core.getInput('token', { required: true });
  core.setSecret(token);

  const [configOwner, configRepo] = core.getInput('config-repository').split('/');
  if (!configOwner || !configRepo) {
    throw new Error('Invalid config-repository');
  }

  return {
    token,
    configOwner,
    configRepo,
    configPath: core.getInput('config-path'),
    configRef: core.getInput('config-ref'),
    repositoryKey: core.getInput('repository-key') || defaultRepo,
    base: core.getInput('base'),
    matrixDefaults: {
      workingDirectory: core.getInput('working-directory') || '.',
      testCommand: core.getInput('test-command') || 'npm test',
      buildCommand: core.getInput('build-command') || 'npm run build',
      lintCommand: core.getInput('lint-command') || 'npm run lint',
      runTests: core.getBooleanInput('run-tests'),
      runBuild: core.getBooleanInput('run-build'),
      runLint: core.getBooleanInput('run-lint'),
    },
  };
}

async function fetchCentralConfig(octokit: Octokit, inputs: ActionInputs): Promise<string> {
  const config = await octokit.rest.repos.getContent({
    owner: inputs.configOwner,
    repo: inputs.configRepo,
    path: inputs.configPath,
    ref: inputs.configRef,
  });

  if (Array.isArray(config.data) || !('content' in config.data) || !config.data.content) {
    throw new Error('Central config must be a file');
  }

  return Buffer.from(config.data.content, 'base64').toString('utf8');
}

async function collectChangedFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseOverride: string
): Promise<{ files: string[]; fullRun: boolean }> {
  const { eventName, payload, sha } = github.context;

  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const pullNumber = payload.pull_request?.number;
    if (!pullNumber) {
      throw new Error('Missing pull request number');
    }

    const changes = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    if (changes.length >= 3000) {
      throw new Error('PR file listing reached GitHub API limit; refusing incomplete filter');
    }

    const files = changes.flatMap((file) =>
      file.previous_filename ? [file.filename, file.previous_filename] : [file.filename]
    );

    return { files: [...new Set(files)], fullRun: false };
  }

  if (eventName === 'push') {
    const before = baseOverride || payload.before;
    if (!before || /^0+$/.test(before)) {
      return { files: [], fullRun: true };
    }

    const result = await octokit.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${before}...${sha}`,
      per_page: 100,
    });

    if ((result.data.total_commits ?? 0) > 250 || (result.data.files?.length ?? 0) >= 300) {
      throw new Error('Commit comparison may be truncated; refusing incomplete filter');
    }

    const files = (result.data.files ?? []).flatMap((file) =>
      file.previous_filename ? [file.filename, file.previous_filename] : [file.filename]
    );

    return { files: [...new Set(files)], fullRun: false };
  }

  throw new Error(`Unsupported event ${eventName}; use a dedicated dispatch policy`);
}

async function writeSummary(
  owner: string,
  repo: string,
  filesCount: number,
  changes: string[],
  fullRun: boolean
): Promise<void> {
  const matchedText = fullRun ? 'Initial push · all filters' : changes.join(', ') || 'None';

  await core.summary
    .addHeading('🧬 Central paths filter')
    .addTable([
      [
        { data: 'Repository', header: true },
        { data: 'Changed files', header: true },
        { data: 'Matched filters', header: true },
      ],
      [`${owner}/${repo}`, String(filesCount), matchedText],
    ])
    .write();
}

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;
  const inputs = getInputs(repo);
  const octokit = github.getOctokit(inputs.token);

  const yaml = await fetchCentralConfig(octokit, inputs);
  const filters = selectFilters(yaml, inputs.repositoryKey);
  const { files, fullRun } = await collectChangedFiles(octokit, owner, repo, inputs.base);

  const changes = resolveMatchedFilters(files, filters, fullRun);
  const matrix = buildFilterMatrix(changes, filters, inputs.matrixDefaults);

  core.setOutput('files', JSON.stringify(files));
  core.setOutput('changes', JSON.stringify(changes));
  core.setOutput('any', String(changes.length > 0));
  core.setOutput('full-run', String(fullRun));
  core.setOutput('matrix', JSON.stringify(matrix));

  await writeSummary(owner, repo, files.length, changes, fullRun);
}

main().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
