#!/usr/bin/env node
// Generate a short-lived GitHub App installation token on demand.
// Credentials stay local: BOT_APP_ID and BOT_PRIVATE_KEY_FILE (or BOT_PRIVATE_KEY).
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const appId = process.env.BOT_APP_ID || process.env.GITHUB_APP_ID;
const key = process.env.BOT_PRIVATE_KEY_FILE
  ? readFileSync(process.env.BOT_PRIVATE_KEY_FILE, 'utf8')
  : process.env.BOT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const owner = process.env.BOT_OWNER || 'rodkisten';
if (!appId || !key) {
  console.error('Set BOT_APP_ID and BOT_PRIVATE_KEY_FILE (or BOT_PRIVATE_KEY).');
  process.exit(2);
}
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = encode({ alg: 'RS256', typ: 'JWT' });
const payload = encode({ iat: now - 60, exp: now + 540, iss: appId });
const unsigned = `${header}.${payload}`;
const jwt = `${unsigned}.${sign('RSA-SHA256', Buffer.from(unsigned), createPrivateKey(key)).toString('base64url')}`;
async function api(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token || jwt}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rod-github-app-token',
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} on ${path}: ${(await response.text()).slice(0, 350)}`);
  return response.json();
}
try {
  const installationId = process.env.BOT_INSTALLATION_ID ||
    (await api(`/orgs/${encodeURIComponent(owner)}/installation`).catch(async () =>
      api(`/users/${encodeURIComponent(owner)}/installation`))).id;
  const repository = process.env.BOT_REPOSITORY;
  const permissions = process.env.BOT_PERMISSIONS
    ? Object.fromEntries(process.env.BOT_PERMISSIONS.split(',').map((item) => {
        const [name, access] = item.trim().split(':');
        if (!name || !['read', 'write'].includes(access)) throw new Error('BOT_PERMISSIONS format: contents:write,actions:write');
        return [name, access];
      }))
    : undefined;
  const body = {
    ...(repository ? { repositories: repository.split(',').map((item) => item.trim()).filter(Boolean) } : {}),
    ...(permissions ? { permissions } : {}),
  };
  const result = await api(`/app/installations/${installationId}/access_tokens`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (process.argv.includes('--expires-at')) {
    console.log(result.expires_at);
  } else {
    // Only print token to stdout; callers should avoid logging it.
    console.log(result.token);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
