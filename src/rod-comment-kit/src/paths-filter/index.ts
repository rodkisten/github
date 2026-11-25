import * as github from '@actions/github';
import { runAction } from '../utils/action.js';
import type { Octokit } from '../utils/git.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';
import {
  buildFilterMatrix,
  type FilterMatrixDefaults,
  resolveMatchedFilters,
  selectFilters,
} from './rules.js';

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

function parseActionInputs(defaultRepo: string): ActionInputs {
  const parsed = getInputs({
    token: { required: true, secret: true },
    'config-repository': { default: 'rodkisten/github' },
    'config-path': { default: 'config/paths.yml' },
    'config-ref': { default: 'main' },
    'repository-key': { default: defaultRepo },
    base: { default: '' },
    'working-directory': { default: '.' },
    'test-command': { default: 'npm test' },
    'build-command': { default: 'npm run build' },
    'lint-command': { default: 'npm run lint' },
    'run-tests': { type: 'boolean', default: true },
    'run-build': { type: 'boolean', default: true },
    'run-lint': { type: 'boolean', default: false },
  });

  const [configOwner, configRepo] = parsed['config-repository'].split('/');
  if (!configOwner || !configRepo) {
    throw new Error('Invalid config-repository');
  }

  return {
    token: parsed.token,
    configOwner,
    configRepo,
    configPath: parsed['config-path'],
    configRef: parsed['config-ref'],
    repositoryKey: parsed['repository-key'] || defaultRepo,
    base: parsed.base,
    matrixDefaults: {
      workingDirectory: parsed['working-directory'],
      testCommand: parsed['test-command'],
      buildCommand: parsed['build-command'],
      lintCommand: parsed['lint-command'],
      runTests: parsed['run-tests'],
      runBuild: parsed['run-build'],
      runLint: parsed['run-lint'],
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

runAction('Central Paths Filter', async () => {
  const { owner, repo } = github.context.repo;

  logger.banner('Central Paths Filter', `${owner}/${repo} · ${github.context.eventName}`);

  const inputs = await logger.step('Load inputs & configuration', () => {
    const parsed = parseActionInputs(repo);
    logger.item('Config repository', `${parsed.configOwner}/${parsed.configRepo}`);
    logger.item('Config path', `${parsed.configPath}@${parsed.configRef}`);
    logger.item('Repository key', parsed.repositoryKey, true);
    return parsed;
  });

  const octokit = github.getOctokit(inputs.token);

  const filters = await logger.step('Resolve repository filter rules', async () => {
    const source = await fetchCentralConfig(octokit, inputs);
    const selected = selectFilters(source, inputs.repositoryKey);
    logger.item('Available filters', Object.keys(selected).join(', '), true);
    return selected;
  });

  const { files, fullRun } = await logger.step('Collect changed files', async () => {
    const collected = await collectChangedFiles(octokit, owner, repo, inputs.base);
    logger.item('Changed files count', collected.files.length);
    logger.item('Full run fallback', collected.fullRun, true);
    return collected;
  });

  const { changes, matrix } = await logger.step('Evaluate path matches & build matrix', () => {
    const matched = resolveMatchedFilters(files, filters, fullRun);
    const resolvedMatrix = buildFilterMatrix(matched, filters, inputs.matrixDefaults);
    logger.item('Matched filters', matched.length > 0 ? matched.join(', ') : 'none', true);
    return { changes: matched, matrix: resolvedMatrix };
  });

  logger.divider('Outputs & Summary');

  setOutputs({
    changes,
    any: changes.length > 0,
    files,
    'full-run': fullRun,
    matrix,
  });

  await summary.publish('🧬 Central Paths Filter', [
    {
      kv: {
        Repository: inputs.repositoryKey,
        'Matched filters': changes.length > 0 ? changes.join(', ') : 'None',
        'Changed files': files.length,
        'Full run': fullRun ? 'Yes' : 'No',
      },
    },
  ]);

  logger.success(
    `Evaluated ${Object.keys(filters).length} filters → ${style.bold(`${changes.length} matched`)}`
  );
  logger.divider('', '═');
});
