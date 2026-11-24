import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-CY5RWTKN.js";
import { a as listWorkspaceChanges, i as listTrackedFiles, r as listChangedFiles } from "./git-D7-Jsfse.js";
import { t as summary } from "./summary-DmC3uIL8.js";
import { n as cmd } from "./cmd-BHIVgqV-.js";
// src/format/process.ts
async function execute(program, args) {
	const res = await cmd(program, args).nothrow();
	if (res.missing) logger.debug(`Executable "${program}" not found`);
	return {
		ok: res.exitCode === 0,
		stdout: res.stdout,
		stderr: res.stderr,
		missing: res.missing,
		code: res.exitCode
	};
}
// src/format/shell.ts
const ZSH_NAMES = /* @__PURE__ */ new Set([
	".zshrc",
	".zprofile",
	".zshenv",
	".zlogin",
	".zlogout"
]);
const BASH_NAMES = /* @__PURE__ */ new Set([
	".bashrc",
	".bash_profile",
	".bash_login",
	".bash_logout"
]);
function shellDialect(file) {
	const name = basename(file);
	const ext = extname(file).toLowerCase();
	if (ext === ".zsh" || ZSH_NAMES.has(name)) return "zsh";
	if (ext === ".bash" || BASH_NAMES.has(name)) return "bash";
	try {
		const firstLine = readFileSync(file, "utf8").split(/\r?\n/, 1)[0] ?? "";
		if (!firstLine.startsWith("#!")) return ext === ".sh" ? "posix" : void 0;
		if (/\bzsh\b/.test(firstLine)) return "zsh";
		if (/\bbash\b/.test(firstLine)) return "bash";
		if (/\b(?:sh|dash|ash)\b/.test(firstLine)) return "posix";
	} catch {
		return ext === ".sh" ? "posix" : void 0;
	}
	return ext === ".sh" ? "posix" : void 0;
}
async function shellTools(file, mode, lint, runner = execute) {
	const dialect = shellDialect(file);
	if (!dialect) return [];
	const issues = [];
	const invoke = async (tool, args, validateOutput = false) => {
		const result = await runner(tool, args);
		if (result.missing) {
			logger.debug(`Skipping ${tool} for ${file}: not installed`);
			issues.push({
				file,
				tool,
				dialect,
				status: "skipped",
				detail: `${tool} is not installed`
			});
			return;
		}
		const failed = !result.ok || validateOutput && result.stdout.trim().length > 0;
		const detail = failed ? (result.stderr || result.stdout).slice(-2e3) : void 0;
		if (failed) logger.warn(`${tool} (${dialect}) reported issues in ${file}`, tool);
		else logger.debug(`${tool} (${dialect}) passed on ${file}`);
		issues.push({
			file,
			tool,
			dialect,
			status: failed ? "failed" : "ok",
			detail
		});
	};
	if (dialect === "zsh") {
		await invoke("zsh", ["-n", file]);
		return issues;
	}
	await invoke("shfmt", [
		mode === "fix" ? "-w" : "-d",
		"-ln",
		dialect === "bash" ? "bash" : "posix",
		file
	]);
	if (lint) {
		await invoke("shellcheck", [
			"-s",
			dialect === "bash" ? "bash" : "sh",
			"-f",
			"gcc",
			file
		]);
		await invoke(dialect === "bash" ? "bash" : "sh", ["-n", file]);
	}
	return issues;
}
// src/format/index.ts
const groups = {
	prettier: [
		".js",
		".jsx",
		".mjs",
		".cjs",
		".ts",
		".tsx",
		".mts",
		".cts",
		".json",
		".jsonc",
		".yaml",
		".yml",
		".css",
		".scss",
		".less",
		".html",
		".vue",
		".md",
		".mdx",
		".graphql",
		".gql",
		".svelte",
		".astro"
	],
	go: [".go"],
	rust: [".rs"],
	python: [".py"],
	shell: [
		".sh",
		".bash",
		".zsh"
	]
};
function listFiles(scope, base) {
	return scope === "all" ? listTrackedFiles() : listChangedFiles(base);
}
function classify(file) {
	const extension = extname(file).toLowerCase();
	return shellDialect(file) ? "shell" : Object.entries(groups).find(([, extensions]) => extensions.includes(extension))?.[0];
}
async function runTool(tool, args) {
	const result = await execute(tool, args);
	return {
		ok: result.ok,
		detail: (result.stderr || result.stdout).slice(-2500),
		missing: result.missing
	};
}
async function formatFiles(files, mode, lint) {
	const results = [];
	for (const language of Object.keys(groups)) {
		const selected = files.filter((file) => classify(file) === language);
		if (!selected.length) continue;
		if (language === "shell") for (const file of selected) for (const issue of await shellTools(file, mode, lint)) results.push({
			language: issue.dialect,
			tool: issue.tool,
			files: 1,
			status: issue.status,
			detail: issue.detail
		});
		else if (language === "prettier") {
			const prettier = "node_modules/.bin/prettier";
			if (!existsSync(prettier)) {
				logger.debug("Prettier binary not found in node_modules/.bin/prettier, skipping");
				results.push({
					language,
					tool: "prettier",
					files: selected.length,
					status: "skipped",
					detail: "Install repository dependencies first"
				});
				continue;
			}
			const check = await runTool(prettier, [
				mode === "fix" ? "--write" : "--check",
				"--ignore-unknown",
				...selected
			]);
			results.push({
				language,
				tool: "prettier",
				files: selected.length,
				status: check.ok ? "ok" : "failed",
				detail: check.ok ? void 0 : check.detail
			});
			if (lint) {
				const eslint = "node_modules/.bin/eslint";
				const js = selected.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
				if (js.length && existsSync(eslint)) {
					const checked = await runTool(eslint, [...mode === "fix" ? ["--fix"] : [], ...js]);
					results.push({
						language: "javascript",
						tool: "eslint",
						files: js.length,
						status: checked.ok ? "ok" : "failed",
						detail: checked.ok ? void 0 : checked.detail
					});
				}
			}
		} else {
			const tool = {
				go: "gofmt",
				rust: "rustfmt",
				python: "ruff"
			}[language];
			const checked = await runTool(tool, language === "go" ? mode === "fix" ? ["-w", ...selected] : ["-l", ...selected] : language === "rust" ? mode === "fix" ? [
				"--emit",
				"files",
				...selected
			] : ["--check", ...selected] : language === "python" ? mode === "fix" ? ["format", ...selected] : [
				"format",
				"--check",
				...selected
			] : []);
			const ok = checked.ok && !(language === "go" && mode === "check" && checked.detail?.trim());
			results.push({
				language,
				tool,
				files: selected.length,
				status: checked.missing ? "skipped" : ok ? "ok" : "failed",
				detail: ok ? void 0 : checked.detail
			});
		}
	}
	return results;
}
async function runFormatAction() {
	const inputs = getInputs({
		mode: { default: "check" },
		scope: { default: "changed" },
		base: { default: "origin/main" },
		lint: {
			type: "boolean",
			default: true
		},
		"results-file": { default: "" },
		"commit-files-path": { default: "" }
	});
	const mode = inputs.mode === "fix" ? "fix" : "check";
	const scope = inputs.scope === "all" ? "all" : "changed";
	const base = inputs.base;
	logger.banner("Rod Universal Format", `${mode.toUpperCase()} · ${scope}`);
	const files = await logger.step("Discover target files", () => {
		const discovered = listFiles(scope, base);
		logger.item("Scope", scope);
		logger.item("Base ref", base);
		logger.item("Files found", discovered.length, true);
		return discovered;
	});
	const before = new Map(files.map((path) => [path, readFileSync(path)]));
	const results = await logger.step(`Format & lint (${files.length} file(s))`, async () => {
		const res = await logger.spin(`Executing formatters & linters (${mode})`, () => formatFiles(files, mode, inputs.lint));
		for (const r of res) logger.item(`${r.tool} (${r.language})`, `${r.status} · ${r.files} file(s)`);
		return res;
	});
	const changed = mode === "fix" ? listWorkspaceChanges().filter((path) => before.has(path) && existsSync(path) && !before.get(path).equals(readFileSync(path))) : [];
	const failed = results.filter((result) => result.status === "failed");
	const skipped = results.filter((result) => result.status === "skipped");
	const suggestedCommit = `style(format): normalize ${changed.length || files.length} files [skip ci]`;
	if (inputs["commit-files-path"]) {
		writeFileSync(inputs["commit-files-path"], JSON.stringify(changed.map((path) => ({
			path,
			content: readFileSync(path, "utf8")
		}))));
		logger.item("Commit payload written to", inputs["commit-files-path"]);
	}
	if (inputs["results-file"]) {
		writeFileSync(inputs["results-file"], JSON.stringify(results, null, 2));
		logger.item("Results JSON written to", inputs["results-file"], true);
	}
	setOutputs({
		"changed-files": changed,
		"result-json": results,
		"suggested-commit": suggestedCommit
	});
	await summary.publish(`🎨 Rod Format · ${mode.toUpperCase()}`, [
		{ table: results.map((r) => ({
			Tool: r.tool,
			Language: r.language,
			Files: r.files,
			Result: r.status === "ok" ? "✅ ok" : r.status === "failed" ? "❌ failed" : "⚠️ skipped"
		})) },
		{ text: `**Scope:** ${scope} · **Selected:** ${files.length} · **Changed:** ${changed.length}\n\nSuggested commit: \`${suggestedCommit}\`` },
		...failed.map((r) => ({ details: {
			summary: `❌ ${r.tool} diagnostics`,
			content: r.detail || "Failed",
			codeLang: "text"
		} })),
		...skipped.map((r) => ({ text: `⚠️ **${r.tool}:** ${r.detail || "Unavailable"}` }))
	]);
	if (failed.length > 0) throw new Error(`${failed.length} formatting/lint check(s) failed`);
	logger.success(`Format check completed (${style.bold(`${changed.length} file(s) modified`)})`);
	logger.divider("", "═");
}
runAction("Rod Universal Format", runFormatAction);
export { runFormatAction as i, formatFiles as n, listFiles as r, classify as t };
