import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { logger, style } from './logger.js';

export const DEFAULT_SHELL = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

export interface CommandResult {
  exitCode: number;
  durationMs: number;
}

export interface ShellResult extends CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  output: string;
  missing: boolean;
}

export interface CmdOptions {
  shell?: string;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: 'pipe' | 'inherit';
  rejectOnNonZero?: boolean;
  spinner?: string;
  strictPipefail?: boolean;
}

function quoteShellArg(value: unknown): string {
  if (value === null || value === undefined) return "''";
  if (Array.isArray(value)) {
    return value.map((item) => quoteShellArg(item)).join(' ');
  }
  const str = String(value);
  if (str === '') return "''";
  if (/^[a-zA-Z0-9_./:-]+$/.test(str)) return str;

  if (process.platform === 'win32') {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `'${str.replace(/'/g, `'\\''`)}'`;
}

function buildInterpolatedCommand(
  strings: TemplateStringsArray,
  values: unknown[]
): string {
  return strings.reduce((acc, part, index) => {
    const interpolated = index < values.length ? quoteShellArg(values[index]) : '';
    return acc + part + interpolated;
  }, '');
}

export function runCommand(
  command: string,
  shell = DEFAULT_SHELL,
  env: NodeJS.ProcessEnv = process.env
): Promise<CommandResult> {
  return spawnShellProcess(command, {
    shell,
    env,
    stdio: 'inherit',
    rejectOnNonZero: false,
    strictPipefail: true,
  }).then(({ exitCode, durationMs }) => ({ exitCode, durationMs }));
}

function spawnShellProcess(
  command: string,
  options: CmdOptions = {}
): Promise<ShellResult> {
  const {
    shell = DEFAULT_SHELL,
    cwd = process.cwd(),
    env = process.env,
    stdio = 'pipe',
    rejectOnNonZero = true,
    strictPipefail = false,
  } = options;

  logger.debug(`Executing in ${cwd}: ${style.cyan(command)}`);

  return new Promise((resolve, reject) => {
    const started = performance.now();
    const usePipefail = strictPipefail && process.platform !== 'win32';
    const child = usePipefail
      ? spawn(shell, ['-eo', 'pipefail', '-c', command], { cwd, stdio, env })
      : spawn(command, { cwd, shell, stdio, env });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    if (stdio === 'pipe') {
      child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    }

    child.once('error', (error: NodeJS.ErrnoException) => {
      const durationMs = Math.round(performance.now() - started);
      if (error.code === 'ENOENT' && !rejectOnNonZero) {
        logger.debug(`Executable not found (ENOENT) for "${command}"`);
        resolve({
          command,
          exitCode: 127,
          stdout: '',
          stderr: error.message,
          output: error.message,
          durationMs,
          missing: true,
        });
        return;
      }
      logger.error(`Spawn error for "${command}": ${error.message}`);
      reject(error);
    });

    child.once('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - started);
      if (signal) {
        const signalError = new Error(`Command terminated by signal ${signal}`);
        logger.error(signalError.message);
        return reject(signalError);
      }

      const exitCode = code ?? 1;
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trimEnd();
      const stderr = Buffer.concat(stderrChunks).toString('utf8').trimEnd();
      const output = [stdout, stderr].filter(Boolean).join('\n');
      const missing = exitCode === 127 || /not found|command not found/i.test(stderr);

      const result: ShellResult = {
        command,
        exitCode,
        stdout,
        stderr,
        output,
        durationMs,
        missing,
      };

      logger.debug(`Finished (${exitCode}) in ${durationMs}ms: ${command}`);

      if (rejectOnNonZero && exitCode !== 0) {
        const error = Object.assign(
          new Error(
            `Command failed with exit code ${exitCode}: ${command}${stderr ? `\n${stderr}` : ''}`
          ),
          result
        );
        logger.error(`Command failed (exit ${exitCode}): ${command}`);
        return reject(error);
      }

      resolve(result);
    });
  });
}

function executeShellCommand(
  command: string,
  options: CmdOptions = {}
): Promise<ShellResult> {
  if (options.spinner && (options.stdio ?? 'pipe') === 'pipe') {
    return logger.spin(options.spinner, () => spawnShellProcess(command, options));
  }
  return spawnShellProcess(command, options);
}

export class CommandTask implements PromiseLike<ShellResult> {
  private baseCommand: string;
  private extraArgs: unknown[] = [];
  private options: CmdOptions;
  private executionPromise?: Promise<ShellResult>;

  constructor(baseCommand: string, options: CmdOptions = {}, initialArgs: unknown[] = []) {
    this.baseCommand = baseCommand;
    this.options = { ...options };
    if (initialArgs.length > 0) {
      this.extraArgs.push(...initialArgs);
    }
  }

  arg(value: unknown): this {
    this.extraArgs.push(value);
    return this;
  }

  args(...values: unknown[]): this {
    for (const item of values) {
      if (Array.isArray(item)) {
        this.extraArgs.push(...item);
      } else if (item !== undefined && item !== null && item !== false) {
        this.extraArgs.push(item);
      }
    }
    return this;
  }

  flag(name: string, value?: string | number | boolean | null): this {
    if (value === undefined || value === null || value === false) return this;
    this.extraArgs.push(name);
    if (value !== true) {
      this.extraArgs.push(value);
    }
    return this;
  }

  cwd(dir: string): this {
    this.options.cwd = dir;
    return this;
  }

  env(vars: NodeJS.ProcessEnv): this {
    this.options.env = { ...(this.options.env ?? process.env), ...vars };
    return this;
  }

  shell(shellPath: string): this {
    this.options.shell = shellPath;
    return this;
  }

  inherit(): this {
    this.options.stdio = 'inherit';
    return this;
  }

  pipe(): this {
    this.options.stdio = 'pipe';
    return this;
  }

  spin(label: string): this {
    this.options.spinner = label;
    return this;
  }

  nothrow(): this {
    this.options.rejectOnNonZero = false;
    return this;
  }

  pipefail(enabled = true): this {
    this.options.strictPipefail = enabled;
    return this;
  }

  toString(): string {
    if (this.extraArgs.length === 0) return this.baseCommand;
    const serializedArgs = this.extraArgs.map((arg) => quoteShellArg(arg)).join(' ');
    return `${this.baseCommand} ${serializedArgs}`;
  }

  run(): Promise<ShellResult> {
    if (!this.executionPromise) {
      this.executionPromise = executeShellCommand(this.toString(), this.options);
    }
    return this.executionPromise;
  }

  then<TResult1 = ShellResult, TResult2 = never>(
    onfulfilled?: ((value: ShellResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export interface CmdFactory {
  (strings: TemplateStringsArray, ...values: unknown[]): CommandTask;
  (command: string, options?: CmdOptions): CommandTask;
  (command: string, args: unknown[], options?: CmdOptions): CommandTask;
  (defaultOptions: CmdOptions): CmdFactory;
}

function createCmd(defaultOptions: CmdOptions = {}): CmdFactory {
  const fn = (
    first: TemplateStringsArray | string | CmdOptions,
    second?: unknown,
    third?: unknown
  ): CommandTask | CmdFactory => {
    if (typeof first === 'string') {
      if (Array.isArray(second)) {
        const opts = (third as CmdOptions) ?? {};
        return new CommandTask(first, { ...defaultOptions, ...opts }, second);
      }
      const opts = (second as CmdOptions) ?? {};
      return new CommandTask(first, { ...defaultOptions, ...opts });
    }

    return createCmd({ ...defaultOptions, ...(first as CmdOptions) });
  };

  const polyFn = (
    first: TemplateStringsArray | string | CmdOptions,
    ...rest: unknown[]
  ): CommandTask | CmdFactory => {
    if (Array.isArray(first) && 'raw' in first) {
      const command = buildInterpolatedCommand(first as TemplateStringsArray, rest);
      return new CommandTask(command, defaultOptions);
    }
    return fn(first, rest[0], rest[1]);
  };

  return polyFn as CmdFactory;
}

export const cmd: CmdFactory = createCmd();
