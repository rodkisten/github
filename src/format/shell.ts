import { extname, basename } from 'node:path';
import { readFileSync } from 'node:fs';
import { execute, type ProcessResult } from './process.js';

export type ShellDialect = 'bash' | 'posix' | 'zsh';
export type ShellIssue = { file: string; tool: string; dialect: ShellDialect; status: 'ok' | 'failed' | 'skipped'; detail?: string };

export function shellDialect(file: string): ShellDialect | undefined {
  const name = basename(file);
  const ext = extname(file).toLowerCase();
  if (ext === '.zsh' || name === '.zshrc' || name === '.zprofile' || name === '.zshenv' || name === '.zlogin' || name === '.zlogout') return 'zsh';
  if (ext === '.bash' || name === '.bashrc' || name === '.bash_profile' || name === '.bash_login' || name === '.bash_logout') return 'bash';
  if (ext === '.sh') return 'posix';
  try {
    const firstLine = readFileSync(file, 'utf8').split(/\r?\n/, 1)[0] ?? '';
    if (!firstLine.startsWith('#!')) return undefined;
    if (/\bzsh\b/.test(firstLine)) return 'zsh';
    if (/\bbash\b/.test(firstLine)) return 'bash';
    if (/\b(?:sh|dash|ash)\b/.test(firstLine)) return 'posix';
  } catch { return undefined; }
  return undefined;
}

export function shellTools(file: string, mode: 'check' | 'fix', lint: boolean, runner: (program: string, args: string[]) => ProcessResult = execute): ShellIssue[] {
  const dialect = shellDialect(file);
  if (!dialect) return [];
  const issues: ShellIssue[] = [];
  const invoke = (tool: string, args: string[], validateOutput = false): void => {
    const result = runner(tool, args);
    const failed = !result.ok || (validateOutput && result.stdout.trim().length > 0);
    issues.push({ file, tool, dialect, status: result.missing ? 'skipped' : failed ? 'failed' : 'ok', detail: result.missing ? tool + ' is not installed' : failed ? (result.stderr || result.stdout).slice(-2000) : undefined });
  };
  // shfmt does not parse Zsh syntax. Zsh uses zsh -n for syntax validation.
  if (dialect === 'zsh') {
    invoke('zsh', ['-n', file]);
    return issues;
  }
  invoke('shfmt', [...(mode === 'fix' ? ['-w'] : ['-d']), '-ln', dialect === 'bash' ? 'bash' : 'posix', file]);
  if (lint) {
    invoke('shellcheck', ['-s', dialect === 'bash' ? 'bash' : 'sh', '-f', 'gcc', file]);
    invoke(dialect === 'bash' ? 'bash' : 'sh', ['-n', file]);
  }
  return issues;
}
