import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { a as style, i as logger } from "./inputs-BuTruFqa.js";
// src/utils/cmd.ts
const DEFAULT_SHELL = process.platform === "win32" ? "cmd.exe" : "/bin/bash";
function quoteShellArg(value) {
	if (value === null || value === void 0) return "''";
	if (Array.isArray(value)) return value.map((item) => quoteShellArg(item)).join(" ");
	const str = String(value);
	if (str === "") return "''";
	if (/^[a-zA-Z0-9_./:-]+$/.test(str)) return str;
	if (process.platform === "win32") return `"${str.replace(/"/g, "\\\"")}"`;
	return `'${str.replace(/'/g, `'\\''`)}'`;
}
function buildInterpolatedCommand(strings, values) {
	return strings.reduce((acc, part, index) => {
		const interpolated = index < values.length ? quoteShellArg(values[index]) : "";
		return acc + part + interpolated;
	}, "");
}
function runCommand(command, shell = DEFAULT_SHELL, env = process.env) {
	return spawnShellProcess(command, {
		shell,
		env,
		stdio: "inherit",
		rejectOnNonZero: false,
		strictPipefail: true
	}).then(({ exitCode, durationMs }) => ({
		exitCode,
		durationMs
	}));
}
function spawnShellProcess(command, options = {}) {
	const { shell = DEFAULT_SHELL, cwd = process.cwd(), env = process.env, stdio = "pipe", rejectOnNonZero = true, strictPipefail = false } = options;
	logger.debug(`Executing in ${cwd}: ${style.cyan(command)}`);
	return new Promise((resolve, reject) => {
		const started = performance.now();
		const child = strictPipefail && process.platform !== "win32" ? spawn(shell, [
			"-eo",
			"pipefail",
			"-c",
			command
		], {
			cwd,
			stdio,
			env
		}) : spawn(command, {
			cwd,
			shell,
			stdio,
			env
		});
		const stdoutChunks = [];
		const stderrChunks = [];
		if (stdio === "pipe") {
			child.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
			child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));
		}
		child.once("error", (error) => {
			const durationMs = Math.round(performance.now() - started);
			if (error.code === "ENOENT" && !rejectOnNonZero) {
				logger.debug(`Executable not found (ENOENT) for "${command}"`);
				resolve({
					command,
					exitCode: 127,
					stdout: "",
					stderr: error.message,
					output: error.message,
					durationMs,
					missing: true
				});
				return;
			}
			logger.error(`Spawn error for "${command}": ${error.message}`);
			reject(error);
		});
		child.once("close", (code, signal) => {
			const durationMs = Math.round(performance.now() - started);
			if (signal) {
				const signalError = /* @__PURE__ */ new Error(`Command terminated by signal ${signal}`);
				logger.error(signalError.message);
				return reject(signalError);
			}
			const exitCode = code ?? 1;
			const stdout = Buffer.concat(stdoutChunks).toString("utf8").trimEnd();
			const stderr = Buffer.concat(stderrChunks).toString("utf8").trimEnd();
			const result = {
				command,
				exitCode,
				stdout,
				stderr,
				output: [stdout, stderr].filter(Boolean).join("\n"),
				durationMs,
				missing: exitCode === 127 || /not found|command not found/i.test(stderr)
			};
			logger.debug(`Finished (${exitCode}) in ${durationMs}ms: ${command}`);
			if (rejectOnNonZero && exitCode !== 0) {
				const error = Object.assign(/* @__PURE__ */ new Error(`Command failed with exit code ${exitCode}: ${command}${stderr ? `\n${stderr}` : ""}`), result);
				logger.error(`Command failed (exit ${exitCode}): ${command}`);
				return reject(error);
			}
			resolve(result);
		});
	});
}
function executeShellCommand(command, options = {}) {
	if (options.spinner && (options.stdio ?? "pipe") === "pipe") return logger.spin(options.spinner, () => spawnShellProcess(command, options));
	return spawnShellProcess(command, options);
}
var CommandTask = class {
	baseCommand;
	extraArgs = [];
	options;
	executionPromise;
	constructor(baseCommand, options = {}, initialArgs = []) {
		this.baseCommand = baseCommand;
		this.options = { ...options };
		if (initialArgs.length > 0) this.extraArgs.push(...initialArgs);
	}
	arg(value) {
		this.extraArgs.push(value);
		return this;
	}
	args(...values) {
		for (const item of values) if (Array.isArray(item)) this.extraArgs.push(...item);
		else if (item !== void 0 && item !== null && item !== false) this.extraArgs.push(item);
		return this;
	}
	flag(name, value) {
		if (value === void 0 || value === null || value === false) return this;
		this.extraArgs.push(name);
		if (value !== true) this.extraArgs.push(value);
		return this;
	}
	cwd(dir) {
		this.options.cwd = dir;
		return this;
	}
	env(vars) {
		this.options.env = {
			...this.options.env ?? process.env,
			...vars
		};
		return this;
	}
	shell(shellPath) {
		this.options.shell = shellPath;
		return this;
	}
	inherit() {
		this.options.stdio = "inherit";
		return this;
	}
	pipe() {
		this.options.stdio = "pipe";
		return this;
	}
	spin(label) {
		this.options.spinner = label;
		return this;
	}
	nothrow() {
		this.options.rejectOnNonZero = false;
		return this;
	}
	pipefail(enabled = true) {
		this.options.strictPipefail = enabled;
		return this;
	}
	toString() {
		if (this.extraArgs.length === 0) return this.baseCommand;
		const serializedArgs = this.extraArgs.map((arg) => quoteShellArg(arg)).join(" ");
		return `${this.baseCommand} ${serializedArgs}`;
	}
	run() {
		if (!this.executionPromise) this.executionPromise = executeShellCommand(this.toString(), this.options);
		return this.executionPromise;
	}
	then(onfulfilled, onrejected) {
		return this.run().then(onfulfilled, onrejected);
	}
};
function createCmd(defaultOptions = {}) {
	const fn = (first, second, third) => {
		if (typeof first === "string") {
			if (Array.isArray(second)) {
				const opts = third ?? {};
				return new CommandTask(first, {
					...defaultOptions,
					...opts
				}, second);
			}
			const opts = second ?? {};
			return new CommandTask(first, {
				...defaultOptions,
				...opts
			});
		}
		return createCmd({
			...defaultOptions,
			...first
		});
	};
	const polyFn = (first, ...rest) => {
		if (Array.isArray(first) && "raw" in first) return new CommandTask(buildInterpolatedCommand(first, rest), defaultOptions);
		return fn(first, rest[0], rest[1]);
	};
	return polyFn;
}
const cmd = createCmd();
export { cmd as n, runCommand as r, DEFAULT_SHELL as t };
