import * as core from '@actions/core';
import * as github from '@actions/github';
import { logger, style } from '../utils/logger.js';
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
  return logger.spin(
    `Fetching ${inputs.configOwner}/${inputs.configRepo}/${inputs.configPath}@${inputs.configRef}`,
    async () => {
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
  );
}

async function collectChangedFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseOverride: string
): Promise<{ files: string[]; fullRun: boolean }> {
  const { eventName, payload, sha } = github.context;

  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const number = payload.pull_request?.number;
    if (!number) {
      throw new Error('Missing pull request number');
    }

    const changes = await logger.spin(`Listing files for PR #${number}`, () =>
      octokit.paginate(octokit.rest.pulls.listFiles, {
        owner,
        repo,
        pull_number: number,
        per_page: 100,
      })
    );

    if (changes.length >= 3000) {
      throw new Error('PR file listing reached GitHub API limit; refusing incomplete filter');
    }

    const files = changes.flatMap((f) =>
      f.previous_filename ? [f.filename, f.previous_filename] : [f.filename]
    );

    return { files: [...new Set(files)], fullRun: false };
  }

  if (eventName === 'push') {
    const before = baseOverride || payload.before;
    const after = sha;

    if (!before || /^0+$/.test(before)) {
      logger.warn('Initial push or zeroed base SHA detected; triggering full run', 'Full Run');
      return { files: [], fullRun: true };
    }

    const result = await logger.spin(
      `Comparing commits ${before.slice(0, 7)}...${after.slice(0, 7)}`,
      () =>
        octokit.rest.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${before}...${after}`,
          per_page: 100,
        })
    );

    if ((result.data.total_commits ?? 0) > 250 || (result.data.files?.length ?? 0) >= 300) {
      throw new Error('Commit comparison may be truncated; refusing incomplete filter');
    }

    const files = (result.data.files ?? []).flatMap((f) =>
      f.previous_filename ? [f.filename, f.previous_filename] : [f.filename]
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
  await core.summary
    .addHeading('🧬 Central paths filter')
    .addTable([
      [
        { data: 'Repository', header: true },
        { data: 'Changed files', header: true },
        { data: 'Matched filters', header: true },
      ],
      [
        `${owner}/${repo}`,
        String(filesCount),
        fullRun ? 'Initial push · all filters' : changes.join(', ') || 'None',
      ],
    ])
    .write();
}

async function main(): Promise<void> {
  const { owner, repo } = github.context.repo;

  logger.banner('Central Paths Filter', `${owner}/${repo} · ${github.context.eventName}`);

  const inputs = await logger.step('Load inputs & configuration', () => {
    const parsed = getInputs(repo);
    logger.item('Config repository', `${parsed.configOwner}/${parsed.configRepo}`);
    logger.item('Config path', `${parsed.configPath}@${parsed.configRef}`);
    logger.item('Repository key', parsed.repositoryKey, true);
    return parsed;
  });

  const octokit = github.getOctokit(inputs.token);

  const filters = await logger.step('Fetch & parse central rules', async () => {
    const yaml = await fetchCentralConfig(octokit, inputs);
    const parsedFilters = selectFilters(yaml, inputs.repositoryKey);
    logger.item('Configured filters', Object.keys(parsedFilters).join(', ') || 'none', true);
    return parsedFilters;
  });

  const { files, fullRun } = await logger.step('Collect changed files', async () => {
    const result = await collectChangedFiles(octokit, owner, repo, inputs.base);
    logger.item('Unique files changed', result.files.length);
    logger.item('Full run mode', result.fullRun, true);
    return result;
  });

  const { changes, matrix } = await logger.step('Match filters & build matrix', () => {
    const matched = resolveMatchedFilters(files, filters, fullRun);
    const builtMatrix = buildFilterMatrix(matched, filters, inputs.matrixDefaults);

    if (matched.length > 0) {
      logger.info(`Matched filters: ${style.bold(matched.join(', '))}`);
    } else {
      logger.info('No filters matched');
    }
    logger.item('Matrix jobs generated', builtMatrix.length, true);

    return { changes: matched, matrix: builtMatrix };
  });

  logger.divider('Outputs & Job Summary');

  core.setOutput('files', JSON.stringify(files));
  core.setOutput('changes', JSON.stringify(changes));
  core.setOutput('any', String(changes.length > 0));
  core.setOutput('full-run', String(fullRun));
  core.setOutput('matrix', JSON.stringify(matrix));

  await writeSummary(owner, repo, files.length, changes, fullRun);

  logger.success('Central paths filter finished');
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'Central Paths Filter');
  core.setFailed(message);
});
