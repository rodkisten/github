import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { cmd } from '../utils/cmd.js';
import { logger } from '../utils/logger.js';

export type ShellDialect = 'bash' | 'posix' | 'zsh';

export interface ShellIssue {
  file: string;
  tool: string;
  dialect: ShellDialect;
  status: 'ok' | 'failed' | 'skipped';
  detail?: string;
}

export interface ToolRunResult {
  ok: boolean;
  missing?: boolean;
  stdout: string;
  stderr: string;
}

export type ToolRunner = (program: string, args: string[]) => Promise<ToolRunResult>;

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
  if (ext === '.sh') return 'posix';

  try {
    const firstLine = readFileSync(file, 'utf8').split(/\r?\n/, 1)[0] ?? '';
    if (!firstLine.startsWith('#!')) return undefined;
    if (/\bzsh\b/.test(firstLine)) return 'zsh';
    if (/\bbash\b/.test(firstLine)) return 'bash';
    if (/\b(?:sh|dash|ash)\b/.test(firstLine)) return 'posix';
  } catch {
    return undefined;
  }

  return undefined;
}

const defaultRunner: ToolRunner = async (program, args) => {
  try {
    const res = await cmd(program, args).nothrow();
    const missing = res.exitCode === 127 || /not found/i.test(res.stderr);

    return {
      ok: res.exitCode === 0,
      missing,
      stdout: res.stdout,
      stderr: res.stderr,
    };
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException).code === 'ENOENT';
    return {
      ok: false,
      missing: isMissing,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
};

export async function shellTools(
  file: string,
  mode: 'check' | 'fix',
  lint: boolean,
  runner: ToolRunner = defaultRunner
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

  // shfmt does not parse Zsh syntax. Zsh uses zsh -n for syntax validation.
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
