import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as core from '@actions/core';
import { runAction } from '../utils/action.js';
import { cmd } from '../utils/cmd.js';
import { getInputs, setOutputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';

function resolvePlatformBinary(): string {
  const platform = process.platform;
  const arch = process.arch;

  const osMap: Record<string, string> = {
    linux: 'linux',
    darwin: 'darwin',
  };

  const archMap: Record<string, string> = {
    x64: 'amd64',
    arm64: 'arm64',
  };

  const os = osMap[platform];
  const cpu = archMap[arch];

  if (!os) throw new Error(`Unsupported OS for rodlog: ${platform}`);
  if (!cpu) throw new Error(`Unsupported architecture for rodlog: ${arch}`);

  return `rodlog_${os}_${cpu}`;
}

runAction('Setup rodlog', async () => {
  const inputs = getInputs({
    'release-base': { default: 'https://rodkisten.github.io/rodlog/releases' },
  });

  const baseUrl = inputs['release-base'].replace(/\/$/, '');
  const binaryName = resolvePlatformBinary();
  const runnerTemp = process.env.RUNNER_TEMP || tmpdir();
  const targetPath = join(runnerTemp, 'rodlog');

  logger.banner('Setup rodlog', `${binaryName} · SHA-256 verified`);

  await logger.step('Download & verify rodlog binary', async () => {
    logger.item('Mirror', baseUrl);
    logger.item('Artifact', binaryName, true);

    const checksumsText = await logger.spin('Fetching checksums.txt', async () => {
      const res = await fetch(`${baseUrl}/checksums.txt`);
      if (!res.ok) throw new Error(`Failed to fetch checksums.txt (${res.status})`);
      return res.text();
    });

    const expectedLine = checksumsText
      .split(/\r?\n/)
      .find((line) => new RegExp(`^[a-fA-F0-9]{64}\s+${binaryName}$`).test(line.trim()));

    if (!expectedLine) {
      throw new Error(`Checksum entry not found for ${binaryName}`);
    }

    const expectedHash = expectedLine.trim().split(/\s+/)[0].toLowerCase();

    const binaryBuffer = await logger.spin(`Downloading ${binaryName}`, async () => {
      const res = await fetch(`${baseUrl}/${binaryName}`);
      if (!res.ok) throw new Error(`Failed to download ${binaryName} (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    });

    const actualHash = createHash('sha256').update(binaryBuffer).digest('hex').toLowerCase();
    if (actualHash !== expectedHash) {
      throw new Error(
        `SHA-256 checksum mismatch for ${binaryName}: expected ${expectedHash}, got ${actualHash}`
      );
    }

    mkdirSync(runnerTemp, { recursive: true });
    const stageFile = join(runnerTemp, `.rodlog-${Date.now()}`);
    try {
      writeFileSync(stageFile, binaryBuffer);
      chmodSync(stageFile, 0o755);
      writeFileSync(targetPath, readFileSync(stageFile));
      chmodSync(targetPath, 0o755);
    } finally {
      rmSync(stageFile, { force: true });
    }

    core.addPath(runnerTemp);
    const versionRes = await cmd(`"${targetPath}" version`).nothrow();
    logger.item('Verified SHA-256', `${expectedHash.slice(0, 12)}...`);
    logger.item('Installed binary', targetPath);
    logger.item('Version', versionRes.stdout || 'unknown', true);
  });

  setOutputs({ binary: targetPath });

  await summary.publish('🌈 rodlog ready', [
    {
      text: `Verified \`${binaryName}\` against the published SHA-256 checksum.`,
    },
  ]);

  logger.success(`rodlog installed at ${style.bold(targetPath)}`);
  logger.divider('', '═');
});
