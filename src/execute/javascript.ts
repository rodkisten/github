import * as core from '@actions/core';
import * as gh from '@actions/github';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

async function main() {
  const token = process.env.ROD_EXEC_TOKEN;
  delete process.env.ROD_EXEC_TOKEN;
  if (token) core.setSecret(token);
  const github = token ? gh.getOctokit(token) : undefined;
  const context = gh.context;
  const logger = { info: core.info, warn: core.warning, error: core.error, debug: core.debug };
  const exec = (command: string): Promise<void> => new Promise((ok, fail) => {
    const child = spawn('/bin/bash', ['-e', '-o', 'pipefail', '-c', command], { stdio: 'inherit' });
    child.once('error', fail);
    child.once('close', (code, signal) => code === 0 ? ok() : fail(new Error('Command failed: ' + (code ?? signal))));
  });
  const require = createRequire(resolve(process.cwd(), 'package.json'));
  const helpers = { core, github, context, exec, logger, require };
  let result: unknown;
  if (process.env.FILE) {
    const mod = await import(pathToFileURL(resolve(process.cwd(), process.env.FILE)).href);
    if (typeof mod.default !== 'function') throw new Error('JavaScript file must export a default function');
    result = await mod.default(helpers);
  } else {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    result = await new AsyncFunction(...Object.keys(helpers), process.env.SCRIPT ?? '')(...Object.values(helpers));
  }
  core.setOutput('result', JSON.stringify(result ?? null));
}
main().catch(error => core.setFailed(error instanceof Error ? error.message : String(error)));
