import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

const contracts = {
  commit: { contents: 'write' },
  publish: { contents: 'write', 'pull-requests': "${{ inputs.mode == 'pull-request' && 'write' || '' }}" },
  'create-pr': { contents: 'read', 'pull-requests': 'write' },
  'format-report': { contents: 'read', 'pull-requests': 'write', issues: 'write' },
  console: { contents: 'read', actions: 'read' },
  'paths-filter': { contents: 'read', 'pull-requests': 'read' },
  push: { contents: 'write' },
  run: { contents: 'read', actions: 'write' },
};

describe.each(Object.entries(contracts))('%s authentication contract', (name, permissions) => {
  const manifest = YAML.parse(readFileSync('src/' + name + '/action.yml', 'utf8'));
  const steps = manifest.runs.steps;
  const auth = steps.find((step: { id?: string }) => step.id === 'auth');
  const validation = steps[0];
  it('uses official authentication with explicit permissions and automatic revocation', () => {
    expect(auth.uses).toBe('actions/create-github-app-token@v2');
    expect(auth.if).toBe("inputs.app-id != '' && inputs.private-key != ''");
    expect(auth.with['app-id']).toBe('${{ inputs.app-id }}');
    expect(auth.with['private-key']).toBe('${{ inputs.private-key }}');
    expect(auth.with['skip-token-revoke']).toBeUndefined();
    expect(Object.fromEntries(Object.entries(auth.with).filter(([key]) => key.startsWith('permission-')).map(([key, value]) => [key.slice(11), value]))).toEqual(permissions);
  });
  it('forwards the generated token or supplied token without remote internal references', () => {
    const tokenInput = ['console', 'format-report'].includes(name) ? 'github-token' : 'token';
    const operation = steps[steps.length - 1];
    expect(Object.values(operation.env)).toContain('${{ steps.auth.outputs.token || inputs.' + tokenInput + ' }}');
    expect(steps.some((step: { uses?: string }) => step.uses?.startsWith('rodkisten/github/'))).toBe(false);
  });
  it.each([false, true])('validates every credential combination (token=%s)', (token) => {
    for (const id of [false, true]) for (const key of [false, true]) {
      const result = spawnSync('bash', ['-c', validation.run], {
        encoding: 'utf8',
        env: { ...process.env, HAS_ID: String(id), HAS_KEY: String(key), HAS_APP_ID: String(id), HAS_PRIVATE_KEY: String(key), HAS_TOKEN: String(token) },
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(id === key && (name === 'console' || id || token) ? 0 : 1);
    }
  });
});
