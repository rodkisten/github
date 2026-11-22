import * as core from '@actions/core';
import { createAppAuth } from '@octokit/auth-app';
import { request } from '@octokit/request';
import { logger, style } from '../utils/logger.js';

type PermissionLevel = 'read' | 'write' | 'admin';

interface AppTokenInputs {
  appId: string;
  privateKey: string;
  owner: string;
  repositories?: string[];
  permissions: Record<string, PermissionLevel>;
}

function parseRepositories(raw: string): string[] | undefined {
  if (!raw.trim()) return undefined;
  return raw
    .split(/[\n,]+/)
    .map((repo) => repo.trim())
    .filter(Boolean);
}

function getInputs(): AppTokenInputs {
  const appId = core.getInput('app-id', { required: true });
  const privateKey = core.getInput('private-key', { required: true });
  core.setSecret(privateKey);

  const owner = core.getInput('owner') || process.env.GITHUB_REPOSITORY_OWNER || '';
  if (!owner) {
    throw new Error('Installation owner is required');
  }

  const repositories = parseRepositories(core.getInput('repositories'));
  const permissionContents = core.getInput('permission-contents') as PermissionLevel;
  const permissionPullRequests = core.getInput('permission-pull-requests') as PermissionLevel;

  const permissions: Record<string, PermissionLevel> = {};
  if (permissionContents) permissions.contents = permissionContents;
  if (permissionPullRequests) permissions.pull_requests = permissionPullRequests;

  return {
    appId,
    privateKey,
    owner,
    repositories,
    permissions,
  };
}

async function resolveInstallationId(appJwt: string, owner: string): Promise<number> {
  return logger.spin(`Resolving GitHub App installation for "${owner}"`, async () => {
    try {
      const { data } = await request('GET /users/{username}/installation', {
        username: owner,
        headers: {
          authorization: `bearer ${appJwt}`,
        },
      });
      return data.id;
    } catch {
      throw new Error(
        `Could not find an installation of GitHub App for owner "${owner}". Ensure the app is installed.`
      );
    }
  });
}

async function runMain(): Promise<void> {
  logger.banner('GitHub App Token', 'Mint scoped installation token');

  const inputs = await logger.step('Load App configuration', () => {
    const parsed = getInputs();
    logger.item('App ID', parsed.appId);
    logger.item('Owner', parsed.owner);
    logger.item(
      'Repositories',
      parsed.repositories ? parsed.repositories.join(', ') : 'all accessible'
    );
    logger.item(
      'Permissions',
      Object.entries(parsed.permissions)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ') || 'default',
      true
    );
    return parsed;
  });

  const token = await logger.step('Mint installation token', async () => {
    const auth = createAppAuth({
      appId: inputs.appId,
      privateKey: inputs.privateKey,
    });

    const appAuth = await logger.spin('Authenticating as GitHub App (JWT)', () =>
      auth({ type: 'app' })
    );

    const installationId = await resolveInstallationId(appAuth.token, inputs.owner);
    logger.item('Installation ID', installationId);

    const installationAuth = await logger.spin('Requesting scoped installation token', () =>
      auth({
        type: 'installation',
        installationId,
        repositoryNames: inputs.repositories,
        permissions: inputs.permissions,
      })
    );

    return installationAuth.token;
  });

  logger.divider('Outputs & State');

  core.setSecret(token);
  core.saveState('token', token);
  core.setOutput('token', token);

  logger.success(`Installation token minted for ${style.bold(inputs.owner)}`);
  logger.divider('', '═');
}

async function runPost(): Promise<void> {
  const token = core.getState('token');
  if (!token) {
    logger.debug('No installation token found in state to revoke.');
    return;
  }

  logger.banner('GitHub App Token · Cleanup', 'Revoking installation token');

  await logger.step('Revoke installation token', async () => {
    try {
      await logger.spin('Calling DELETE /installation/token', () =>
        request('DELETE /installation/token', {
          headers: {
            authorization: `token ${token}`,
          },
        })
      );
      logger.success('Installation token revoked');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to revoke installation token: ${message}`, 'Token Cleanup');
    }
  });

  logger.divider('', '═');
}

async function run(): Promise<void> {
  const isPost = Boolean(core.getState('isPost'));

  if (!isPost) {
    core.saveState('isPost', 'true');
    await runMain();
  } else {
    await runPost();
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'GitHub App Token');
  core.setFailed(message);
});
