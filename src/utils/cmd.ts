import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { logger, style } from './logger.js';

const DEFAULT_SHELL = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

/**
 * Basic result of a shell process execution.
 */
export interface CommandResult {
  /** Exit code returned by the process (`0` indicates success). */
  exitCode: number;
  /** Total execution duration in milliseconds. */
  durationMs: number;
}

/**
 * Detailed execution result returned by {@link cmd} and {@link CommandTask}.
 */
export interface ShellResult extends CommandResult {
  /** Final serialized command string sent to the shell. */
  command: string;
  /** Captured standard output (`stdout`) with trailing newlines trimmed. */
  stdout: string;
  /** Captured standard error (`stderr`) with trailing newlines trimmed. */
  stderr: string;
  /** Combined `stdout` and `stderr` joined by a newline. */
  output: string;
}

/**
 * Configuration options for executing shell commands.
 */
export interface CmdOptions {
  /** Shell executable to use (default: `'cmd.exe'` on Windows or `'/bin/bash'` on POSIX). */
  shell?: string;
  /** Working directory where the command will be executed (default: `process.cwd()`). */
  cwd?: string;
  /** Environment variables passed to the child process (default: `process.env`). */
  env?: NodeJS.ProcessEnv;
  /**
   * Child process I/O mode:
   * - `'pipe'`: captures `stdout` and `stderr` in memory (default).
   * - `'inherit'`: streams output directly to the current terminal/log.
   */
  stdio?: 'pipe' | 'inherit';
  /**
   * When `true` (default), rejects the Promise if `exitCode !== 0`.
   * When `false`, resolves normally with the returned `exitCode`.
   */
  rejectOnNonZero?: boolean;
  /**
   * Optional label to wrap execution in a `logger.spin` indicator (only used when `stdio` is `'pipe'`).
   */
  spinner?: string;
}

/**
 * Escapes interpolated values or appended arguments for safe shell usage,
 * preventing command injection while preserving whitespace, quotes, and special characters.
 *
 * @param value - Primitive value or array of values to serialize.
 * @returns Properly escaped shell argument string.
 */
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

/**
 * Builds a command string from a tagged template literal,
 * automatically escaping all interpolated expressions.
 */
function buildInterpolatedCommand(
  strings: TemplateStringsArray,
  values: unknown[]
): string {
  return strings.reduce((acc, part, index) => {
    const interpolated = index < values.length ? quoteShellArg(values[index]) : '';
    return acc + part + interpolated;
  }, '');
}

/**
 * Executes a command string while streaming output directly to the terminal (`stdio: 'inherit'`).
 * Does not throw on non-zero exit codes (only rejects on spawn errors or OS signals).
 *
 * @param command - Full command line string to execute.
 * @param shell - Shell executable path (default: `'cmd.exe'` on Windows or `'/bin/bash'` on POSIX).
 * @param env - Process environment variables (default: `process.env`).
 * @returns Promise resolving to `exitCode` and `durationMs`.
 *
 * @example
 * ```ts
 * const { exitCode, durationMs } = await runCommand('npm test', '/bin/bash');
 * if (exitCode !== 0) {
 *   process.exit(exitCode);
 * }
 * ```
 */
export function runCommand(
  command: string,
  shell = DEFAULT_SHELL,
  env: NodeJS.ProcessEnv = process.env
): Promise<CommandResult> {
  logger.debug(`Running command (${shell}): ${command}`);

  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(command, {
      cwd: process.cwd(),
      shell,
      stdio: 'inherit',
      env,
    });

    child.once('error', (error) => {
      logger.error(`Failed to spawn command: ${error.message}`);
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
      logger.debug(`Command exited with code ${exitCode} in ${durationMs}ms`);
      resolve({ exitCode, durationMs });
    });
  });
}

/**
 * Spawns the underlying shell process and resolves or rejects with {@link ShellResult}.
 */
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
  } = options;

  logger.debug(`Executing in ${cwd}: ${style.cyan(command)}`);

  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(command, {
      cwd,
      shell,
      stdio,
      env,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    if (stdio === 'pipe') {
      child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    }

    child.once('error', (error) => {
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

      const result: ShellResult = {
        command,
        exitCode,
        stdout,
        stderr,
        output,
        durationMs,
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

/**
 * Wraps execution in a logger spinner when `options.spinner` is configured and output is piped.
 */
function executeShellCommand(
  command: string,
  options: CmdOptions = {}
): Promise<ShellResult> {
  if (options.spinner && (options.stdio ?? 'pipe') === 'pipe') {
    return logger.spin(options.spinner, () => spawnShellProcess(command, options));
  }
  return spawnShellProcess(command, options);
}

/**
 * **Lazy** and **fluent** command builder implementing `PromiseLike<ShellResult>`.
 *
 * The child process is **not** spawned upon instantiation; execution only starts
 * when `await` is applied directly to the task or when {@link run} is called.
 *
 * @example
 * ```ts
 * // Build the task lazily using fluent chaining
 * const task = cmd('npx eslint')
 *   .cwd('./packages/api')
 *   .flag('--fix', isFixMode)
 *   .flag('--max-warnings', 0)
 *   .args(['src/index.ts', 'src/utils/logger.ts'])
 *   .nothrow();
 *
 * // Inspect the serialized command before running
 * console.log('Running:', task.toString());
 *
 * // Trigger execution via await
 * const { exitCode, stdout, stderr } = await task;
 * ```
 */
export class CommandTask implements PromiseLike<ShellResult> {
  private baseCommand: string;
  private extraArgs: unknown[] = [];
  private options: CmdOptions;
  private executionPromise?: Promise<ShellResult>;

  /**
   * Creates a new lazy command task.
   *
   * @param baseCommand - Base command or pre-interpolated command string.
   * @param options - Initial execution options.
   * @param initialArgs - Initial arguments to escape and append.
   */
  constructor(baseCommand: string, options: CmdOptions = {}, initialArgs: unknown[] = []) {
    this.baseCommand = baseCommand;
    this.options = { ...options };
    if (initialArgs.length > 0) {
      this.extraArgs.push(...initialArgs);
    }
  }

  /**
   * Appends a single escaped argument to the command.
   *
   * @param value - Argument value.
   * @returns The current instance for fluent chaining.
   *
   * @example
   * ```ts
   * await cmd('git checkout').arg('feat/new-branch');
   * ```
   */
  arg(value: unknown): this {
    this.extraArgs.push(value);
    return this;
  }

  /**
   * Appends multiple escaped arguments to the command.
   * Nested arrays are flattened, and `undefined`, `null`, or `false` values are ignored.
   *
   * @param values - List of arguments or argument arrays.
   * @returns The current instance for fluent chaining.
   *
   * @example
   * ```ts
   * const files = ['src/a.ts', 'src/file with spaces.ts'];
   * await cmd('prettier --write').args(files, isVerbose && '--loglevel=debug');
   * ```
   */
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

  /**
   * Appends a conditional CLI flag to the command.
   * - If `value` is `false`, `null`, or `undefined`, nothing is appended.
   * - If `value` is `true`, only `name` is appended (e.g., `--fix`).
   * - If `value` is a `string` or `number`, both `name` and the escaped value are appended (e.g., `--branch 'feat/x'`).
   *
   * @param name - Flag name (e.g., `'--fix'`, `'-m'`).
   * @param value - Boolean toggle or scalar flag value.
   * @returns The current instance for fluent chaining.
   *
   * @example
   * ```ts
   * await cmd('git commit')
   *   .flag('--amend', shouldAmend)
   *   .flag('-m', commitMessage);
   * ```
   */
  flag(name: string, value?: string | number | boolean | null): this {
    if (value === undefined || value === null || value === false) return this;
    this.extraArgs.push(name);
    if (value !== true) {
      this.extraArgs.push(value);
    }
    return this;
  }

  /**
   * Sets the working directory (`cwd`) for the command.
   *
   * @param dir - Directory path.
   * @returns The current instance for fluent chaining.
   */
  cwd(dir: string): this {
    this.options.cwd = dir;
    return this;
  }

  /**
   * Merges additional environment variables into the child process environment.
   *
   * @param vars - Key-value map of environment variables.
   * @returns The current instance for fluent chaining.
   *
   * @example
   * ```ts
   * await cmd('npm run build').env({ NODE_ENV: 'production', CI: 'true' });
   * ```
   */
  env(vars: NodeJS.ProcessEnv): this {
    this.options.env = { ...(this.options.env ?? process.env), ...vars };
    return this;
  }

  /**
   * Sets the shell executable used to run the command.
   *
   * @param shellPath - Shell binary path (e.g., `'/bin/sh'`, `'/bin/zsh'`).
   * @returns The current instance for fluent chaining.
   */
  shell(shellPath: string): this {
    this.options.shell = shellPath;
    return this;
  }

  /**
   * Configures `stdio: 'inherit'` to stream output directly to the terminal/log.
   *
   * @returns The current instance for fluent chaining.
   */
  inherit(): this {
    this.options.stdio = 'inherit';
    return this;
  }

  /**
   * Configures `stdio: 'pipe'` (default) to capture `stdout` and `stderr` in memory.
   *
   * @returns The current instance for fluent chaining.
   */
  pipe(): this {
    this.options.stdio = 'pipe';
    return this;
  }

  /**
   * Displays a `logger.spin` indicator while the command executes (requires `pipe` stdio).
   *
   * @param label - Spinner text label.
   * @returns The current instance for fluent chaining.
   */
  spin(label: string): this {
    this.options.spinner = label;
    return this;
  }

  /**
   * Prevents the Promise from rejecting when `exitCode !== 0`.
   *
   * @returns The current instance for fluent chaining.
   *
   * @example
   * ```ts
   * const { exitCode } = await cmd`git diff --quiet`.nothrow();
   * const hasDiff = exitCode !== 0;
   * ```
   */
  nothrow(): this {
    this.options.rejectOnNonZero = false;
    return this;
  }

  /**
   * Serializes the base command together with all appended arguments.
   *
   * @returns Final command string ready for shell execution.
   */
  toString(): string {
    if (this.extraArgs.length === 0) return this.baseCommand;
    const serializedArgs = this.extraArgs.map((arg) => quoteShellArg(arg)).join(' ');
    return `${this.baseCommand} ${serializedArgs}`;
  }

  /**
   * Starts executing the command (idempotent: subsequent calls return the same Promise).
   *
   * @returns Promise resolving to {@link ShellResult}.
   */
  run(): Promise<ShellResult> {
    if (!this.executionPromise) {
      this.executionPromise = executeShellCommand(this.toString(), this.options);
    }
    return this.executionPromise;
  }

  /**
   * Implements `PromiseLike`, allowing `await task` directly.
   */
  then<TResult1 = ShellResult, TResult2 = never>(
    onfulfilled?: ((value: ShellResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

/**
 * Polymorphic interface for creating and executing shell commands.
 */
export interface CmdFactory {
  /**
   * **Mode 1 — Tagged Template Literal:**
   * Interpolates variables and arrays while automatically escaping them against command injection.
   *
   * @example
   * ```ts
   * const branch = 'feat/login page';
   * const files = ['src/auth.ts', 'src/login.ts'];
   * const { stdout } = await cmd`git diff --name-only ${branch} -- ${files}`;
   * ```
   */
  (strings: TemplateStringsArray, ...values: unknown[]): CommandTask;

  /**
   * **Mode 2 — Standard Function Call with Command String:**
   * Accepts a command string and optional settings, returning a lazy {@link CommandTask}.
   *
   * @example
   * ```ts
   * await cmd('npm run build', { cwd: './packages/core' });
   * ```
   */
  (command: string, options?: CmdOptions): CommandTask;

  /**
   * **Mode 3 — Standard Function Call with Binary & Argument Array:**
   * Escapes each element in `args` and appends it to the base command.
   *
   * @example
   * ```ts
   * await cmd('git', ['commit', '-m', 'feat: add user profile'], { cwd: './repo' });
   * ```
   */
  (command: string, args: unknown[], options?: CmdOptions): CommandTask;

  /**
   * **Mode 4 — Pre-configured Scoped Factory:**
   * Creates a new {@link CmdFactory} instance inheriting the provided default options.
   *
   * @example
   * ```ts
   * const apiCmd = cmd({ cwd: './apps/api', rejectOnNonZero: false });
   *
   * const lint = await apiCmd`npm run lint`;
   * const test = await apiCmd('npm test').env({ CI: 'true' });
   * ```
   */
  (defaultOptions: CmdOptions): CmdFactory;
}

/**
 * Creates a polymorphic {@link CmdFactory} instance with cumulative default options.
 */
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

/**
 * Polymorphic, lazy, and fluent shell command runner.
 *
 * Supports 4 interchangeable usage styles:
 *
 * @example
 * ```ts
 * // 1. Tagged template literal (safe auto-escaping)
 * const { stdout: sha } = await cmd`git rev-parse --short ${ref}`;
 *
 * // 2. Standard function call (string or command + args[])
 * await cmd('npm ci', { cwd: './web' });
 * await cmd('git', ['tag', '-a', version, '-m', `Release ${version}`]);
 *
 * // 3. Lazy + fluent (append arguments/flags later and execute on await)
 * const lintTask = cmd('npx eslint')
 *   .cwd('./web')
 *   .flag('--fix', shouldFix)
 *   .args(changedFiles)
 *   .spin('Running ESLint')
 *   .nothrow();
 *
 * const { exitCode, stderr } = await lintTask;
 *
 * // 4. Scoped factory pre-configured for a directory or context
 * const pkg = cmd({ cwd: './packages/shared', env: { FORCE_COLOR: '1' } });
 * await pkg`npm run build`;
 * await pkg('npm test').inherit();
 * ```
 */
export const cmd: CmdFactory = createCmd();
