import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as tc from '@actions/tool-cache';
import { runAction } from '../utils/action.js';

runAction('Setup Node Workspace', async ({ cmd, utils, logger, style, core }) => {
  const { getInputs, setOutputs } = utils;
  const inputs = getInputs({
    'node-version': { default: '24' },
    'working-directory': { default: '.' },
    install: { type: 'boolean', default: true },
  });

  const cwd = resolve(inputs['working-directory']);
  logger.banner('Setup Node Workspace', `Node ${inputs['node-version']} · ${cwd}`);

  await logger.step('Verify Node.js runtime', async () => {
    const cachedPath = tc.find('node', inputs['node-version']);
    if (cachedPath) {
      core.addPath(join(cachedPath, 'bin'));
      logger.item('Tool cache', cachedPath);
    }

    const versionRes = await cmd('node -v').cwd(cwd).nothrow();
    const npmRes = await cmd('npm -v').cwd(cwd).nothrow();

    logger.item('Node active', versionRes.stdout || 'unknown');
    logger.item('npm active', npmRes.stdout || 'unknown', true);

    setOutputs({ 'node-version': versionRes.stdout.replace(/^v/, '') });
  });

  if (inputs.install) {
    await logger.step('Install workspace dependencies', async () => {
      const hasLockfile = existsSync(join(cwd, 'package-lock.json'));
      const installCmd = hasLockfile
        ? 'npm ci --no-audit --no-fund'
        : 'npm install --no-audit --no-fund';

      logger.item('Strategy', hasLockfile ? 'npm ci (lockfile found)' : 'npm install');
      logger.item('Directory', cwd, true);

      await cmd(installCmd)
        .cwd(cwd)
        .spin(`Installing dependencies in ${inputs['working-directory']}`);
    });
  } else {
    logger.info('Dependency installation skipped (install=false)');
  }

  logger.success(`Node workspace ready at ${style.bold(cwd)}`);
  logger.divider('', '═');
});
