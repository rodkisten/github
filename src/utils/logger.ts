import * as process from 'node:process';

const IS_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true';
const IS_TTY = Boolean(process.stdout.isTTY);
const FORCE_COLOR = process.env.FORCE_COLOR !== '0';

// Códigos ANSI
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  // Texto
  black: '\x1b[30m',
  white: '\x1b[97m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  // Fundos estilo Vite
  bgCyan: '\x1b[46m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  bgMagenta: '\x1b[45m',
  bgBlue: '\x1b[44m',
  bgGray: '\x1b[100m',
} as const;

type StyleFn = (text: string) => string;

const paint = (codes: string): StyleFn =>
  FORCE_COLOR ? (text: string) => `${codes}${text}${ANSI.reset}` : (text: string) => text;

export const style = {
  bold: paint(ANSI.bold),
  dim: paint(ANSI.dim),
  cyan: paint(ANSI.cyan),
  green: paint(ANSI.green),
  yellow: paint(ANSI.yellow),
  red: paint(ANSI.red),
  magenta: paint(ANSI.magenta),
  gray: paint(ANSI.gray),
  // Badges com fundo colorido estilo Vite
  badgeVite: paint(`${ANSI.bgMagenta}${ANSI.white}${ANSI.bold}`),
  badgeInfo: paint(`${ANSI.bgCyan}${ANSI.black}${ANSI.bold}`),
  badgeStep: paint(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}`),
  badgeSuccess: paint(`${ANSI.bgGreen}${ANSI.black}${ANSI.bold}`),
  badgeWarn: paint(`${ANSI.bgYellow}${ANSI.black}${ANSI.bold}`),
  badgeError: paint(`${ANSI.bgRed}${ANSI.white}${ANSI.bold}`),
  badgeMuted: paint(`${ANSI.bgGray}${ANSI.white}${ANSI.bold}`),
};

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function getTerminalWidth(): number {
  const cols = process.stdout.columns;
  if (typeof cols === 'number' && cols > 20) {
    return Math.min(cols, 120);
  }
  return 80; // Largura padrão limpa para o visualizador web do GitHub Actions
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function escapeGitHubCommandValue(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export class Logger {
  private depth = 0;

  private getIndent(isLast = false): string {
    if (this.depth <= 0) return '';
    const parentGuides = style.gray('│  ').repeat(Math.max(0, this.depth - 1));
    const branch = style.gray(isLast ? '└─ ' : '├─ ');
    return `${parentGuides}${branch}`;
  }

  private getContinuationIndent(): string {
    if (this.depth <= 0) return '  ';
    return style.gray('│  ').repeat(this.depth);
  }

  private write(line: string): void {
    process.stdout.write(`${line}\n`);
  }

  /**
   * Cabeçalho principal estilo Vite com versão/contexto e linha dupla proporcional à janela
   */
  banner(title: string, subtitle?: string): void {
    const width = getTerminalWidth();
    const badge = style.badgeVite(` ⚡ ${title.toUpperCase()} `);
    const meta = subtitle ? ` ${style.dim(subtitle)}` : '';
    const line = style.magenta('═'.repeat(width));

    this.write('');
    this.write(line);
    this.write(`${badge}${meta}`);
    this.write(line);
  }

  /**
   * Linha separadora horizontal calculada pela largura da janela
   */
  divider(label?: string, char = '─'): void {
    const width = getTerminalWidth();
    const indentOffset = this.depth * 3;
    const availableWidth = Math.max(10, width - indentOffset);
    const prefix = this.depth > 0 ? style.gray('│  ').repeat(this.depth) : '';

    if (!label) {
      this.write(`${prefix}${style.gray(char.repeat(availableWidth))}`);
      return;
    }

    const cleanLabel = ` ${label} `;
    const labelLen = stripAnsi(cleanLabel).length;
    const remaining = Math.max(4, availableWidth - labelLen);
    const leftLen = 2;
    const rightLen = Math.max(2, remaining - leftLen);

    const line = `${style.gray(char.repeat(leftLen))}${style.cyan(style.bold(cleanLabel))}${style.gray(char.repeat(rightLen))}`;
    this.write(`${prefix}${line}`);
  }

  info(message: string, detail?: string): void {
    const badge = this.depth === 0 ? `${style.badgeInfo(' INFO ')} ` : '';
    const extra = detail ? ` ${style.dim(detail)}` : '';
    this.write(`${this.getIndent()}${badge}${message}${extra}`);
  }

  success(message: string, detail?: string): void {
    const badge = this.depth === 0 ? `${style.badgeSuccess(' DONE ')} ` : `${style.green('✔')} `;
    const extra = detail ? ` ${style.dim(detail)}` : '';
    this.write(`${this.getIndent(true)}${badge}${style.green(message)}${extra}`);
  }

  warn(message: string, title?: string): void {
    if (IS_GITHUB_ACTIONS) {
      const titleProp = title ? ` title=${escapeGitHubCommandValue(title)}` : '';
      this.write(`::warning${titleProp}::${escapeGitHubCommandValue(message)}`);
      return;
    }
    const badge = `${style.badgeWarn(' WARN ')} `;
    this.write(`${this.getIndent()}${badge}${style.yellow(message)}`);
  }

  error(message: string, title?: string): void {
    if (IS_GITHUB_ACTIONS) {
      const titleProp = title ? ` title=${escapeGitHubCommandValue(title)}` : '';
      this.write(`::error${titleProp}::${escapeGitHubCommandValue(message)}`);
      return;
    }
    const badge = `${style.badgeError(' FAIL ')} `;
    this.write(`${this.getIndent(true)}${badge}${style.red(message)}`);
  }

  debug(message: string): void {
    if (IS_GITHUB_ACTIONS) {
      this.write(`::debug::${escapeGitHubCommandValue(message)}`);
      return;
    }
    if (process.env.RUNNER_DEBUG === '1' || process.env.DEBUG) {
      this.write(`${this.getContinuationIndent()}${style.badgeMuted(' DEBUG ')} ${style.dim(message)}`);
    }
  }

  /**
   * Lista itens chave-valor alinhados dentro do nível atual
   */
  item(key: string, value: string | number | boolean, isLast = false): void {
    const formattedValue =
      typeof value === 'boolean'
        ? value
          ? style.green('true')
          : style.gray('false')
        : style.cyan(String(value));

    this.write(`${this.getIndent(isLast)}${style.dim(`${key}:`)} ${formattedValue}`);
  }

  /**
   * Executa um bloco dentro de um Step (suporta aninhamento e ::group:: no GitHub Actions)
   */
  async step<T>(title: string, fn: () => Promise<T> | T, options?: { group?: boolean }): Promise<T> {
    const start = performance.now();
    const useGitHubGroup = IS_GITHUB_ACTIONS && this.depth === 0 && (options?.group ?? true);

    if (useGitHubGroup) {
      this.write(`::group::${title}`);
    }

    if (this.depth === 0) {
      this.divider(title);
    } else {
      this.write(`${this.getIndent()}${style.badgeStep(' STEP ')} ${style.bold(title)}`);
    }

    this.depth++;
    try {
      const result = await fn();
      const elapsed = formatDuration(performance.now() - start);
      this.depth--;

      if (this.depth === 0) {
        this.write(
          `${style.badgeSuccess(' PASS ')} ${style.bold(title)} ${style.dim(`(${elapsed})`)}`
        );
      } else {
        this.write(
          `${this.getIndent(true)}${style.green('✔')} ${title} ${style.dim(`(${elapsed})`)}`
        );
      }

      return result;
    } catch (err) {
      const elapsed = formatDuration(performance.now() - start);
      this.depth--;
      this.write(
        `${this.getIndent(true)}${style.badgeError(' FAIL ')} ${style.red(title)} ${style.dim(`(${elapsed})`)}`
      );
      throw err;
    } finally {
      if (useGitHubGroup) {
        this.write('::endgroup::');
      }
    }
  }

  /**
   * Executa uma operação assíncrona com indicador de loading e tempo decorrido
   */
  async spin<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const indent = this.getIndent();

    // Em CI não-interativo (GitHub Actions), evita spam de frames ANSI
    if (!IS_TTY || IS_GITHUB_ACTIONS) {
      this.write(`${indent}${style.cyan('◌')} ${label}${style.dim('...')}`);
      try {
        const result = await fn();
        const elapsed = formatDuration(performance.now() - start);
        this.write(`${indent}${style.green('●')} ${label} ${style.dim(`(${elapsed})`)}`);
        return result;
      } catch (error) {
        const elapsed = formatDuration(performance.now() - start);
        this.write(`${indent}${style.red('✖')} ${label} ${style.dim(`(${elapsed})`)}`);
        throw error;
      }
    }

    // Terminal interativo (TTY): animação fluida em uma única linha
    let frameIndex = 0;
    const timer = setInterval(() => {
      const frame = style.cyan(SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]);
      const elapsed = style.dim(formatDuration(performance.now() - start));
      process.stdout.write(`\r\x1b[2K${indent}${frame} ${label} ${elapsed}`);
      frameIndex++;
    }, 80);

    try {
      const result = await fn();
      clearInterval(timer);
      const elapsed = style.dim(`(${formatDuration(performance.now() - start)})`);
      process.stdout.write(`\r\x1b[2K${indent}${style.green('✔')} ${label} ${elapsed}\n`);
      return result;
    } catch (error) {
      clearInterval(timer);
      const elapsed = style.dim(`(${formatDuration(performance.now() - start)})`);
      process.stdout.write(`\r\x1b[2K${indent}${style.red('✖')} ${label} ${elapsed}\n`);
      throw error;
    }
  }
}

export const logger = new Logger();
