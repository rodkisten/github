import * as core from '@actions/core';
import { createAppAuth } from '@octokit/auth-app';
import { request } from '@octokit/request';
import { runAction } from '../utils/action.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';

type PermissionLevel = 'read' | 'write' | 'admin';

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

  const {
    'app-id': appId,
    'private-key': privateKey,
    owner,
    repositories,
    permissions,
  } = await logger.step('Load App configuration', () => {
    const parsed = getInputs({
      'app-id': { required: true },
      'private-key': { required: true, secret: true },
      owner: {
        default: process.env.GITHUB_REPOSITORY_OWNER || '',
        parse: (raw) => {
          const resolved = raw || process.env.GITHUB_REPOSITORY_OWNER || '';
          if (!resolved) throw new Error('Installation owner is required');
          return resolved;
        },
      },
      repositories: { type: 'list' },
      'permission-contents': { default: '' },
      'permission-pull-requests': { default: '' },
      'permission-issues': { default: '' },
      'permission-actions': { default: '' },
    });

    const scopedPermissions: Record<string, PermissionLevel> = {};
    if (parsed['permission-contents']) {
      scopedPermissions.contents = parsed['permission-contents'] as PermissionLevel;
    }
    if (parsed['permission-pull-requests']) {
      scopedPermissions.pull_requests = parsed['permission-pull-requests'] as PermissionLevel;
    }
    if (parsed['permission-issues']) {
      scopedPermissions.issues = parsed['permission-issues'] as PermissionLevel;
    }
    if (parsed['permission-actions']) {
      scopedPermissions.actions = parsed['permission-actions'] as PermissionLevel;
    }

    const repoList = parsed.repositories.length > 0 ? parsed.repositories : undefined;

    logger.item('App ID', parsed['app-id']);
    logger.item('Owner', parsed.owner);
    logger.item('Repositories', repoList ? repoList.join(', ') : 'all accessible');
    logger.item(
      'Permissions',
      Object.entries(scopedPermissions)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ') || 'default',
      true
    );

    return {
      ...parsed,
      repositories: repoList,
      permissions: scopedPermissions,
    };
  });

  const { token, appSlug } = await logger.step('Mint installation token', async () => {
    const auth = createAppAuth({
      appId,
      privateKey,
    });

    const appAuth = await logger.spin('Authenticating as GitHub App (JWT)', () =>
      auth({ type: 'app' })
    );

    const appInfo = await logger.spin('Fetching GitHub App metadata', () =>
      request('GET /app', {
        headers: {
          authorization: `bearer ${appAuth.token}`,
        },
      })
    );

    const installationId = await resolveInstallationId(appAuth.token, owner);
    logger.item('Installation ID', installationId);
    logger.item('App Slug', appInfo.data.slug);

    const installationAuth = await logger.spin('Requesting scoped installation token', () =>
      auth({
        type: 'installation',
        installationId,
        repositoryNames: repositories,
        permissions,
      })
    );

    return { token: installationAuth.token, appSlug: appInfo.data.slug };
  });

  logger.divider('Outputs & State');

  core.setSecret(token);
  core.saveState('token', token);
  setOutputs({ token, 'app-slug': appSlug });

  logger.success(`Installation token minted for ${style.bold(owner)} (${appSlug}[bot])`);
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

runAction('GitHub App Token', async () => {
  const isPost = Boolean(core.getState('isPost'));

  if (!isPost) {
    core.saveState('isPost', 'true');
    await runMain();
  } else {
    await runPost();
  }
});
