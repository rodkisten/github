import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { logger } from '../utils/logger.js';
import { execute, type ProcessResult } from './process.js';

export type ShellDialect = 'bash' | 'posix' | 'zsh';

export interface ShellIssue {
  file: string;
  tool: string;
  dialect: ShellDialect;
  status: 'ok' | 'failed' | 'skipped';
  detail?: string;
}

export type ToolRunner = (program: string, args: string[]) => Promise<ProcessResult> | ProcessResult;

const ZSH_NAMES = new Set(['.zshrc', '.zprofile', '.zshenv', '.zlogin', '.zlogout']);
const BASH_NAMES = new Set([
  '.bashrc',
  '.bash_profile',
  '.bash_login',
  '.bash_logout',
]);

export function shellDialect(file: string): ShellDialect | undefined {
  const name = basename(file);
  const ext = extname(file).toLowerCase();

  if (ext === '.zsh' || ZSH_NAMES.has(name)) return 'zsh';
  if (ext === '.bash' || BASH_NAMES.has(name)) return 'bash';

  try {
    const firstLine = readFileSync(file, 'utf8').split(/\r?\n/, 1)[0] ?? '';
    if (!firstLine.startsWith('#!')) return ext === '.sh' ? 'posix' : undefined;
    if (/\bzsh\b/.test(firstLine)) return 'zsh';
    if (/\bbash\b/.test(firstLine)) return 'bash';
    if (/\b(?:sh|dash|ash)\b/.test(firstLine)) return 'posix';
  } catch {
    return undefined;
  }

  return ext === '.sh' ? 'posix' : undefined;
}

export async function shellTools(
  file: string,
  mode: 'check' | 'fix',
  lint: boolean,
  runner: ToolRunner = execute
): Promise<ShellIssue[]> {
  const dialect = shellDialect(file);
  if (!dialect) return [];

  const issues: ShellIssue[] = [];

  const invoke = async (
    tool: string,
    args: string[],
    validateOutput = false
  ): Promise<void> => {
    const result = await runner(tool, args);

    if (result.missing) {
      logger.debug(`Skipping ${tool} for ${file}: not installed`);
      issues.push({
        file,
        tool,
        dialect,
        status: 'skipped',
        detail: `${tool} is not installed`,
      });
      return;
    }

    const failed = !result.ok || (validateOutput && result.stdout.trim().length > 0);
    const detail = failed ? (result.stderr || result.stdout).slice(-2000) : undefined;

    if (failed) {
      logger.warn(`${tool} (${dialect}) reported issues in ${file}`, tool);
    } else {
      logger.debug(`${tool} (${dialect}) passed on ${file}`);
    }

    issues.push({
      file,
      tool,
      dialect,
      status: failed ? 'failed' : 'ok',
      detail,
    });
  };

  if (dialect === 'zsh') {
    await invoke('zsh', ['-n', file]);
    return issues;
  }

  await invoke('shfmt', [
    mode === 'fix' ? '-w' : '-d',
    '-ln',
    dialect === 'bash' ? 'bash' : 'posix',
    file,
  ]);

  if (lint) {
    await invoke('shellcheck', ['-s', dialect === 'bash' ? 'bash' : 'sh', '-f', 'gcc', file]);
    await invoke(dialect === 'bash' ? 'bash' : 'sh', ['-n', file]);
  }

  return issues;
}
