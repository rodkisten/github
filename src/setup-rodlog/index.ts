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

function printFallbackWarningBox(attemptedUrl: string, reason: string): void {
  const width = 76;
  const border = '═'.repeat(width);
  const padLine = (text: string) => {
    const clean = text.slice(0, width - 2);
    return `║ ${clean.padEnd(width - 2)} ║`;
  };

  const box = [
    '',
    `╔${border}╗`,
    padLine('⚠️  AVISO: USANDO FALLBACK TRANSPARENTE DO RODLOG'),
    `╠${border}╣`,
    padLine('Não foi possível baixar ou validar o binário oficial do rodlog.'),
    padLine(`URL tentada: ${attemptedUrl}`),
    padLine(`Motivo: ${reason}`),
    padLine(''),
    padLine('Um wrapper transparente foi criado: tudo após "--" será executado'),
    padLine('diretamente sem interromper o pipeline.'),
    `╚${border}╝`,
    '',
  ].join('\n');

  console.warn(style.yellow ? style.yellow(style.bold(box)) : box);
  core.warning(
    `[rodlog fallback] Falha ao baixar de ${attemptedUrl} (${reason}). Usando wrapper transparente.`
  );
}

function installFallbackScript(targetPath: string): void {
  const fallbackScript = `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const dashDashIndex = args.indexOf('--');

// Pega tudo que vem depois do "--" (ou todos os args se "--" não for passado)
const commandArgs = dashDashIndex !== -1 ? args.slice(dashDashIndex + 1) : args;

if (commandArgs.length === 0) {
  console.warn('[rodlog-fallback] Nenhum comando encontrado após "--".');
  process.exit(0);
}

const [command, ...cmdArgs] = commandArgs;
const result = spawnSync(command, cmdArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(\`[rodlog-fallback] Erro ao executar "\${command}": \${result.error.message}\`);
  process.exit(1);
}

process.exit(result.status ?? 1);
`;

  writeFileSync(targetPath, fallbackScript, 'utf8');
  chmodSync(targetPath, 0o755);
}

runAction('Setup rodlog', async () => {
  const inputs = getInputs({
    'release-base': { default: 'https://rodkisten.github.io/rodlog/releases' },
  });

  const baseUrl = inputs['release-base'].replace(/\/$/, '');
  const runnerTemp = process.env.RUNNER_TEMP || tmpdir();
  const targetPath = join(runnerTemp, 'rodlog');

  let binaryName = 'unknown';
  let attemptedUrl = baseUrl;
  let usedFallback = false;
  let fallbackReason = '';

  try {
    binaryName = resolvePlatformBinary();
    attemptedUrl = `${baseUrl}/${binaryName}`;

    logger.banner('Setup rodlog', `${binaryName} · SHA-256 verified`);

    await logger.step('Download & verify rodlog binary', async () => {
      logger.item('Mirror', baseUrl);
      logger.item('Artifact', binaryName, true);

      const checksumsUrl = `${baseUrl}/checksums.txt`;
      attemptedUrl = checksumsUrl;

      const checksumsText = await logger.spin('Fetching checksums.txt', async () => {
        const res = await fetch(checksumsUrl);
        if (!res.ok) throw new Error(`Failed to fetch checksums.txt (${res.status})`);
        return res.text();
      });

      const expectedLine = checksumsText
        .split(/\r?\n/)
        .find((line) => new RegExp(`^[a-fA-F0-9]{64}\\s+${binaryName}$`).test(line.trim()));

      if (!expectedLine) {
        throw new Error(`Checksum entry not found for ${binaryName}`);
      }

      const expectedHash = expectedLine.trim().split(/\s+/)[0].toLowerCase();

      const binaryUrl = `${baseUrl}/${binaryName}`;
      attemptedUrl = binaryUrl;

      const binaryBuffer = await logger.spin(`Downloading ${binaryName}`, async () => {
        const res = await fetch(binaryUrl);
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
  } catch (err) {
    usedFallback = true;
    fallbackReason = err instanceof Error ? err.message : String(err);

    printFallbackWarningBox(attemptedUrl, fallbackReason);

    mkdirSync(runnerTemp, { recursive: true });
    installFallbackScript(targetPath);
    core.addPath(runnerTemp);

    logger.item('Fallback wrapper', targetPath, true);
  }

  setOutputs({
    binary: targetPath,
    fallback: String(usedFallback),
  });

  if (usedFallback) {
    await summary.publish('⚠️ rodlog ready (fallback mode)', [
      {
        text: `Could not download \`rodlog\` from \`${attemptedUrl}\` (${fallbackReason}). Installed transparent passthrough wrapper instead.`,
      },
    ]);
    logger.success(`rodlog fallback wrapper installed at ${style.bold(targetPath)}`);
  } else {
    await summary.publish('🌈 rodlog ready', [
      {
        text: `Verified \`${binaryName}\` against the published SHA-256 checksum.`,
      },
    ]);
    logger.success(`rodlog installed at ${style.bold(targetPath)}`);
  }

  logger.divider('', '═');
});
