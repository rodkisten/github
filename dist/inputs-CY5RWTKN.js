import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CtzvHsHd.js";
import * as process from "node:process";
// src/utils/logger.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
const IS_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === "true";
const IS_TTY = Boolean(process.stdout.isTTY);
const FORCE_COLOR = process.env.FORCE_COLOR !== "0";
const ANSI = {
	reset: "\x1B[0m",
	bold: "\x1B[1m",
	dim: "\x1B[2m",
	italic: "\x1B[3m",
	black: "\x1B[30m",
	white: "\x1B[97m",
	cyan: "\x1B[36m",
	green: "\x1B[32m",
	yellow: "\x1B[33m",
	red: "\x1B[31m",
	magenta: "\x1B[35m",
	gray: "\x1B[90m",
	bgCyan: "\x1B[46m",
	bgGreen: "\x1B[42m",
	bgYellow: "\x1B[43m",
	bgRed: "\x1B[41m",
	bgMagenta: "\x1B[45m",
	bgBlue: "\x1B[44m",
	bgGray: "\x1B[100m"
};
const paint = (codes) => FORCE_COLOR ? (text) => `${codes}${text}${ANSI.reset}` : (text) => text;
const style = {
	bold: paint(ANSI.bold),
	dim: paint(ANSI.dim),
	cyan: paint(ANSI.cyan),
	green: paint(ANSI.green),
	yellow: paint(ANSI.yellow),
	red: paint(ANSI.red),
	magenta: paint(ANSI.magenta),
	gray: paint(ANSI.gray),
	badgeVite: paint(`${ANSI.bgMagenta}${ANSI.white}${ANSI.bold}`),
	badgeInfo: paint(`${ANSI.bgCyan}${ANSI.black}${ANSI.bold}`),
	badgeStep: paint(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}`),
	badgeSuccess: paint(`${ANSI.bgGreen}${ANSI.black}${ANSI.bold}`),
	badgeWarn: paint(`${ANSI.bgYellow}${ANSI.black}${ANSI.bold}`),
	badgeError: paint(`${ANSI.bgRed}${ANSI.white}${ANSI.bold}`),
	badgeMuted: paint(`${ANSI.bgGray}${ANSI.white}${ANSI.bold}`)
};
function stripAnsi(str) {
	return str.replace(/\x1b\[[0-9;]*m/g, "");
}
function getTerminalWidth() {
	const cols = process.stdout.columns;
	if (typeof cols === "number" && cols > 20) return Math.min(cols, 120);
	return 80;
}
function formatDuration(ms) {
	if (ms < 1e3) return `${Math.round(ms)}ms`;
	return `${(ms / 1e3).toFixed(2)}s`;
}
function escapeGitHubCommandValue(value) {
	return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
const SPINNER_FRAMES = [
	"⠋",
	"⠙",
	"⠹",
	"⠸",
	"⠼",
	"⠴",
	"⠦",
	"⠧",
	"⠇",
	"⠏"
];
var Logger = class {
	depth = 0;
	getIndent(isLast = false) {
		if (this.depth <= 0) return "";
		return `${style.gray("│  ").repeat(Math.max(0, this.depth - 1))}${style.gray(isLast ? "└─ " : "├─ ")}`;
	}
	getContinuationIndent() {
		if (this.depth <= 0) return "  ";
		return style.gray("│  ").repeat(this.depth);
	}
	write(line) {
		process.stdout.write(`${line}\n`);
	}
	banner(title, subtitle) {
		const width = getTerminalWidth();
		const badge = style.badgeVite(` ⚡ ${title.toUpperCase()} `);
		const meta = subtitle ? ` ${style.dim(subtitle)}` : "";
		const line = style.magenta("═".repeat(width));
		this.write("");
		this.write(line);
		this.write(`${badge}${meta}`);
		this.write(line);
	}
	divider(label, char = "─") {
		const width = getTerminalWidth();
		const indentOffset = this.depth * 3;
		const availableWidth = Math.max(10, width - indentOffset);
		const prefix = this.depth > 0 ? style.gray("│  ").repeat(this.depth) : "";
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
	info(message, detail) {
		const badge = this.depth === 0 ? `${style.badgeInfo(" INFO ")} ` : "";
		const extra = detail ? ` ${style.dim(detail)}` : "";
		this.write(`${this.getIndent()}${badge}${message}${extra}`);
	}
	success(message, detail) {
		const badge = this.depth === 0 ? `${style.badgeSuccess(" DONE ")} ` : `${style.green("✔")} `;
		const extra = detail ? ` ${style.dim(detail)}` : "";
		this.write(`${this.getIndent(true)}${badge}${style.green(message)}${extra}`);
	}
	warn(message, title) {
		if (IS_GITHUB_ACTIONS) {
			const titleProp = title ? ` title=${escapeGitHubCommandValue(title)}` : "";
			this.write(`::warning${titleProp}::${escapeGitHubCommandValue(message)}`);
			return;
		}
		const badge = `${style.badgeWarn(" WARN ")} `;
		this.write(`${this.getIndent()}${badge}${style.yellow(message)}`);
	}
	error(message, title) {
		if (IS_GITHUB_ACTIONS) {
			const titleProp = title ? ` title=${escapeGitHubCommandValue(title)}` : "";
			this.write(`::error${titleProp}::${escapeGitHubCommandValue(message)}`);
			return;
		}
		const badge = `${style.badgeError(" FAIL ")} `;
		this.write(`${this.getIndent(true)}${badge}${style.red(message)}`);
	}
	debug(message) {
		if (IS_GITHUB_ACTIONS) {
			this.write(`::debug::${escapeGitHubCommandValue(message)}`);
			return;
		}
		if (process.env.RUNNER_DEBUG === "1" || process.env.DEBUG) this.write(`${this.getContinuationIndent()}${style.badgeMuted(" DEBUG ")} ${style.dim(message)}`);
	}
	item(key, value, isLast = false) {
		const formattedValue = typeof value === "boolean" ? value ? style.green("true") : style.gray("false") : style.cyan(String(value));
		this.write(`${this.getIndent(isLast)}${style.dim(`${key}:`)} ${formattedValue}`);
	}
	async step(title, fn, options) {
		const start = performance.now();
		const useGitHubGroup = IS_GITHUB_ACTIONS && this.depth === 0 && (options?.group ?? true);
		if (useGitHubGroup) this.write(`::group::${title}`);
		if (this.depth === 0) this.divider(title);
		else this.write(`${this.getIndent()}${style.badgeStep(" STEP ")} ${style.bold(title)}`);
		this.depth++;
		try {
			const result = await fn();
			const elapsed = formatDuration(performance.now() - start);
			const succeeded = options?.isSuccess?.(result) ?? true;
			this.depth--;
			if (!succeeded) this.write(`${this.getIndent(true)}${style.badgeError(" FAIL ")} ${style.red(title)} ${style.dim(`(${elapsed})`)}`);
			else if (this.depth === 0) this.write(`${style.badgeSuccess(" PASS ")} ${style.bold(title)} ${style.dim(`(${elapsed})`)}`);
			else this.write(`${this.getIndent(true)}${style.green("✔")} ${title} ${style.dim(`(${elapsed})`)}`);
			return result;
		} catch (err) {
			const elapsed = formatDuration(performance.now() - start);
			this.depth--;
			this.write(`${this.getIndent(true)}${style.badgeError(" FAIL ")} ${style.red(title)} ${style.dim(`(${elapsed})`)}`);
			throw err;
		} finally {
			if (useGitHubGroup) this.write("::endgroup::");
		}
	}
	async spin(label, fn) {
		const start = performance.now();
		const indent = this.getIndent();
		if (!IS_TTY || IS_GITHUB_ACTIONS) {
			this.write(`${indent}${style.cyan("◌")} ${label}${style.dim("...")}`);
			try {
				const result = await fn();
				const elapsed = formatDuration(performance.now() - start);
				this.write(`${indent}${style.green("●")} ${label} ${style.dim(`(${elapsed})`)}`);
				return result;
			} catch (error) {
				const elapsed = formatDuration(performance.now() - start);
				this.write(`${indent}${style.red("✖")} ${label} ${style.dim(`(${elapsed})`)}`);
				throw error;
			}
		}
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
			process.stdout.write(`\r\x1b[2K${indent}${style.green("✔")} ${label} ${elapsed}\n`);
			return result;
		} catch (error) {
			clearInterval(timer);
			const elapsed = style.dim(`(${formatDuration(performance.now() - start)})`);
			process.stdout.write(`\r\x1b[2K${indent}${style.red("✖")} ${label} ${elapsed}\n`);
			throw error;
		}
	}
};
const logger = new Logger();
// src/utils/action.ts
/**
* Wrapper padronizado para entrypoints de GitHub Actions.
* Garante tratamento consistente de erros e logs padronizados sem boilerplate duplicado.
*/
function runAction(name, fn) {
	fn().catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		logger.error(message, name);
		import_core.setFailed(message);
	});
}
// src/utils/inputs.ts
function parseListInput(raw) {
	return raw.split(/[\r\n,]+/).map((item) => item.trim()).filter(Boolean);
}
function getInputs(schema) {
	const result = {};
	for (const [key, field] of Object.entries(schema)) {
		const raw = import_core.getInput(key, { required: field.required ?? false });
		if (field.secret && raw) import_core.setSecret(raw);
		if (!raw && field.default !== void 0) {
			result[key] = field.default;
			continue;
		}
		if (field.parse) {
			result[key] = field.parse(raw);
			continue;
		}
		switch (field.type) {
			case "boolean":
				result[key] = raw ? import_core.getBooleanInput(key) : Boolean(field.default ?? false);
				break;
			case "number": {
				const parsed = Number(raw);
				if (Number.isNaN(parsed)) throw new Error(`Input "${key}" must be a valid number, received "${raw}"`);
				result[key] = parsed;
				break;
			}
			case "list":
				result[key] = raw ? parseListInput(raw) : [];
				break;
			case "json":
				result[key] = raw ? JSON.parse(raw) : field.default;
				break;
			default: result[key] = raw;
		}
	}
	return result;
}
function setOutputs(outputs) {
	for (const [key, value] of Object.entries(outputs)) {
		if (value === void 0 || value === null) continue;
		const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
		import_core.setOutput(key, serialized);
	}
}
export { style as a, logger as i, setOutputs as n, runAction as r, getInputs as t };
