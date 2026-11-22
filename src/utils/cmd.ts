import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

/**
 * Resultado básico da execução de um processo no shell.
 */
export interface CommandResult {
  /** Código de saída retornado pelo processo (`0` indica sucesso). */
  exitCode: number;
  /** Tempo total de execução em milissegundos. */
  durationMs: number;
}

/**
 * Resultado detalhado retornado por {@link cmd} e {@link CommandTask}.
 */
export interface ShellResult extends CommandResult {
  /** Comando final serializado que foi enviado ao shell. */
  command: string;
  /** Saída padrão (`stdout`) capturada sem quebras de linha finais. */
  stdout: string;
  /** Saída de erro (`stderr`) capturada sem quebras de linha finais. */
  stderr: string;
  /** Combinação de `stdout` e `stderr` separados por quebra de linha. */
  output: string;
}

/**
 * Opções de configuração para execução de comandos no shell.
 */
export interface CmdOptions {
  /** Executável do shell a ser utilizado (padrão: `'/bin/bash'`). */
  shell?: string;
  /** Diretório de trabalho onde o comando será executado (padrão: `process.cwd()`). */
  cwd?: string;
  /** Variáveis de ambiente passadas para o processo filho (padrão: `process.env`). */
  env?: NodeJS.ProcessEnv;
  /**
   * Modo de I/O do processo filho:
   * - `'pipe'`: captura `stdout` e `stderr` em memória (padrão).
   * - `'inherit'`: faz streaming direto para o terminal/log atual.
   */
  stdio?: 'pipe' | 'inherit';
  /**
   * Quando `true` (padrão), rejeita a Promise se `exitCode !== 0`.
   * Quando `false`, resolve normalmente com o `exitCode` retornado.
   */
  rejectOnNonZero?: boolean;
}

/**
 * Escapa valores interpolados ou argumentos adicionados para uso seguro em shell POSIX,
 * prevenindo *command injection* e preservando espaços, aspas e caracteres especiais.
 *
 * @param value - Valor primitivo ou array de valores a serem serializados.
 * @returns Argumento devidamente escapado para shell.
 */
function quoteShellArg(value: unknown): string {
  if (value === null || value === undefined) return "''";
  if (Array.isArray(value)) {
    return value.map((item) => quoteShellArg(item)).join(' ');
  }
  const str = String(value);
  if (str === '') return "''";
  if (/^[a-zA-Z0-9_./:-]+$/.test(str)) return str;
  return `'${str.replace(/'/g, `'\\''`)}'`;
}

/**
 * Monta a string de comando a partir de um *tagged template literal*,
 * escapando automaticamente todas as expressões interpoladas.
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
 * Executa uma string de comando fazendo streaming direto no terminal (`stdio: 'inherit'`).
 * Não lança exceção em caso de `exitCode !== 0` (apenas em erro de spawn ou sinal do SO).
 *
 * @param command - Linha de comando completa a ser executada.
 * @param shell - Executável do shell (padrão: `'/bin/bash'`).
 * @param env - Variáveis de ambiente do processo (padrão: `process.env`).
 * @returns Promise resolvida com `exitCode` e `durationMs`.
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
  shell = '/bin/bash',
  env: NodeJS.ProcessEnv = process.env
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(shell, ['-eo', 'pipefail', '-c', command], {
      stdio: 'inherit',
      env,
    });

    child.once('error', reject);
    child.once('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - started);
      if (signal) {
        return reject(new Error(`Command terminated by signal ${signal}`));
      }
      resolve({ exitCode: code ?? 1, durationMs });
    });
  });
}

/**
 * Executa efetivamente o processo no shell e resolve ou rejeita com {@link ShellResult}.
 */
function executeShellCommand(
  command: string,
  options: CmdOptions = {}
): Promise<ShellResult> {
  const {
    shell = '/bin/bash',
    cwd = process.cwd(),
    env = process.env,
    stdio = 'pipe',
    rejectOnNonZero = true,
  } = options;

  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(shell, ['-eo', 'pipefail', '-c', command], {
      cwd,
      env,
      stdio,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    if (stdio === 'pipe') {
      child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    }

    child.once('error', reject);
    child.once('close', (code, signal) => {
      const durationMs = Math.round(performance.now() - started);
      if (signal) {
        return reject(new Error(`Command terminated by signal ${signal}`));
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

      if (rejectOnNonZero && exitCode !== 0) {
        const error = Object.assign(
          new Error(
            `Command failed with exit code ${exitCode}: ${command}${stderr ? `\n${stderr}` : ''}`
          ),
          result
        );
        return reject(error);
      }

      resolve(result);
    });
  });
}

/**
 * Tarefa de comando **lazy** e **fluente** que implementa `PromiseLike<ShellResult>`.
 *
 * O processo filho **não** é iniciado no momento da construção; ele só é disparado
 * quando `await` é usado diretamente sobre a instância ou quando {@link run} é invocado.
 *
 * @example
 * ```ts
 * // Monta a tarefa de forma lazy e encadeada
 * const task = cmd('npx eslint')
 *   .cwd('./packages/api')
 *   .flag('--fix', isFixMode)
 *   .flag('--max-warnings', 0)
 *   .args(['src/index.ts', 'src/utils/logger.ts'])
 *   .nothrow();
 *
 * // Inspeciona o comando antes de executar
 * console.log('Executando:', task.toString());
 *
 * // Dispara a execução via await
 * const { exitCode, stdout, stderr } = await task;
 * ```
 */
export class CommandTask implements PromiseLike<ShellResult> {
  private baseCommand: string;
  private extraArgs: unknown[] = [];
  private options: CmdOptions;
  private executionPromise?: Promise<ShellResult>;

  /**
   * Cria uma nova tarefa de comando lazy.
   *
   * @param baseCommand - Comando base ou string já interpolada.
   * @param options - Opções iniciais de execução.
   * @param initialArgs - Argumentos iniciais a serem escapados e anexados.
   */
  constructor(baseCommand: string, options: CmdOptions = {}, initialArgs: unknown[] = []) {
    this.baseCommand = baseCommand;
    this.options = { ...options };
    if (initialArgs.length > 0) {
      this.extraArgs.push(...initialArgs);
    }
  }

  /**
   * Adiciona um único argumento ao comando (escapado automaticamente).
   *
   * @param value - Valor do argumento.
   * @returns A própria instância para encadeamento fluente.
   *
   * @example
   * ```ts
   * await cmd('git checkout').arg('feat/nova-branch');
   * ```
   */
  arg(value: unknown): this {
    this.extraArgs.push(value);
    return this;
  }

  /**
   * Adiciona múltiplos argumentos ao comando (escapados automaticamente).
   * Arrays são achatados e valores `undefined`, `null` ou `false` são ignorados.
   *
   * @param values - Lista de argumentos ou arrays de argumentos.
   * @returns A própria instância para encadeamento fluente.
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
   * Adiciona uma flag CLI condicional ao comando.
   * - Se `value` for `false`, `null` ou `undefined`, nada é adicionado.
   * - Se `value` for `true`, adiciona apenas `name` (ex.: `--fix`).
   * - Se `value` for `string` ou `number`, adiciona `name` seguido do valor escapado (ex.: `--branch 'feat/x'`).
   *
   * @param name - Nome da flag (ex.: `'--fix'`, `'-m'`).
   * @param value - Valor booleano ou escalar da flag.
   * @returns A própria instância para encadeamento fluente.
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
   * Define o diretório de trabalho (`cwd`) onde o comando será executado.
   *
   * @param dir - Caminho do diretório.
   * @returns A própria instância para encadeamento fluente.
   */
  cwd(dir: string): this {
    this.options.cwd = dir;
    return this;
  }

  /**
   * Mescla variáveis de ambiente adicionais ao ambiente do processo.
   *
   * @param vars - Mapa de variáveis de ambiente.
   * @returns A própria instância para encadeamento fluente.
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
   * Define o executável do shell usado para interpretar o comando.
   *
   * @param shellPath - Caminho do shell (ex.: `'/bin/sh'`, `'/bin/zsh'`).
   * @returns A própria instância para encadeamento fluente.
   */
  shell(shellPath: string): this {
    this.options.shell = shellPath;
    return this;
  }

  /**
   * Configura `stdio: 'inherit'` para fazer streaming direto da saída no terminal/log.
   *
   * @returns A própria instância para encadeamento fluente.
   */
  inherit(): this {
    this.options.stdio = 'inherit';
    return this;
  }

  /**
   * Configura `stdio: 'pipe'` (padrão) para capturar `stdout` e `stderr` em memória.
   *
   * @returns A própria instância para encadeamento fluente.
   */
  pipe(): this {
    this.options.stdio = 'pipe';
    return this;
  }

  /**
   * Evita que a Promise seja rejeitada caso o comando retorne `exitCode !== 0`.
   *
   * @returns A própria instância para encadeamento fluente.
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
   * Serializa o comando base junto com todos os argumentos anexados.
   *
   * @returns String final pronta para execução no shell.
   */
  toString(): string {
    if (this.extraArgs.length === 0) return this.baseCommand;
    const serializedArgs = this.extraArgs.map((arg) => quoteShellArg(arg)).join(' ');
    return `${this.baseCommand} ${serializedArgs}`;
  }

  /**
   * Inicia a execução do comando (idempotente: chamadas subsequentes retornam a mesma Promise).
   *
   * @returns Promise resolvida com {@link ShellResult}.
   */
  run(): Promise<ShellResult> {
    if (!this.executionPromise) {
      this.executionPromise = executeShellCommand(this.toString(), this.options);
    }
    return this.executionPromise;
  }

  /**
   * Implementa a interface `PromiseLike`, permitindo usar `await task` diretamente.
   */
  then<TResult1 = ShellResult, TResult2 = never>(
    onfulfilled?: ((value: ShellResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

/**
 * Interface polimórfica para criação e execução de comandos shell.
 */
export interface CmdFactory {
  /**
   * **Modo 1 — Tagged Template Literal:**
   * Interpola variáveis e arrays escapando-os automaticamente contra *command injection*.
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
   * **Modo 2 — Chamada normal com string:**
   * Aceita uma string de comando e opções opcionais, retornando uma {@link CommandTask} lazy.
   *
   * @example
   * ```ts
   * await cmd('npm run build', { cwd: './packages/core' });
   * ```
   */
  (command: string, options?: CmdOptions): CommandTask;

  /**
   * **Modo 3 — Chamada normal com binário e array de argumentos:**
   * Escapa cada item do array `args` e anexa ao comando base.
   *
   * @example
   * ```ts
   * await cmd('git', ['commit', '-m', 'feat: add user profile'], { cwd: './repo' });
   * ```
   */
  (command: string, args: unknown[], options?: CmdOptions): CommandTask;

  /**
   * **Modo 4 — Factory pré-configurada (Scoped Runner):**
   * Cria uma nova instância de {@link CmdFactory} herdando as opções padrão informadas.
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
 * Cria uma instância polimórfica de {@link CmdFactory} com opções padrão acumuláveis.
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
 * Executor polimórfico, lazy e fluente de comandos shell.
 *
 * Suporta 4 estilos de uso intercambiáveis:
 *
 * @example
 * ```ts
 * // 1. Tagged template literal (interpolação segura)
 * const { stdout: sha } = await cmd`git rev-parse --short ${ref}`;
 *
 * // 2. Chamada normal como função (string ou comando + args[])
 * await cmd('npm ci', { cwd: './web' });
 * await cmd('git', ['tag', '-a', version, '-m', `Release ${version}`]);
 *
 * // 3. Lazy + fluente (adiciona argumentos/flags depois e executa no await)
 * const lintTask = cmd('npx eslint')
 *   .cwd('./web')
 *   .flag('--fix', shouldFix)
 *   .args(changedFiles)
 *   .nothrow();
 *
 * const { exitCode, stderr } = await lintTask;
 *
 * // 4. Factory pré-configurada para um diretório ou contexto
 * const pkg = cmd({ cwd: './packages/shared', env: { FORCE_COLOR: '1' } });
 * await pkg`npm run build`;
 * await pkg('npm test').inherit();
 * ```
 */
export const cmd: CmdFactory = createCmd();
