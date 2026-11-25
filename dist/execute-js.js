import { c as info, d as setOutput, f as setSecret, i as error, n as core_exports, p as warning, r as debug, u as setFailed } from "./core-B0CVUTgi.js";
import { n as getOctokit, t as context } from "./github-DeG2mx_2.js";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
// src/execute/javascript.ts
async function main() {
	const token = process.env.ROD_EXEC_TOKEN;
	delete process.env.ROD_EXEC_TOKEN;
	if (token) setSecret(token);
	const github = token ? getOctokit(token) : void 0;
	const context$1 = context;
	const logger = {
		info,
		warn: warning,
		error,
		debug
	};
	const exec = (command) => new Promise((ok, fail) => {
		const child = spawn("/bin/bash", [
			"-e",
			"-o",
			"pipefail",
			"-c",
			command
		], { stdio: "inherit" });
		child.once("error", fail);
		child.once("close", (code, signal) => code === 0 ? ok() : fail(/* @__PURE__ */ new Error("Command failed: " + (code ?? signal))));
	});
	const require = createRequire(resolve(process.cwd(), "package.json"));
	const helpers = {
		core: core_exports,
		github,
		context: context$1,
		exec,
		logger,
		require
	};
	let result;
	if (process.env.FILE) {
		const mod = await import(pathToFileURL(resolve(process.cwd(), process.env.FILE)).href);
		if (typeof mod.default !== "function") throw new Error("JavaScript file must export a default function");
		result = await mod.default(helpers);
	} else result = await new (Object.getPrototypeOf(async function() {})).constructor(...Object.keys(helpers), process.env.SCRIPT ?? "")(...Object.values(helpers));
	setOutput("result", JSON.stringify(result ?? null));
}
main().catch((error) => setFailed(error instanceof Error ? error.message : String(error)));
export {};
