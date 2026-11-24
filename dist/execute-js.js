import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CtzvHsHd.js";
import { t as require_github } from "./github-W8iOYbtf.js";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
// src/execute/javascript.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
async function main() {
	const token = process.env.ROD_EXEC_TOKEN;
	delete process.env.ROD_EXEC_TOKEN;
	if (token) import_core.setSecret(token);
	const github = token ? import_github.getOctokit(token) : void 0;
	const context = import_github.context;
	const logger = {
		info: import_core.info,
		warn: import_core.warning,
		error: import_core.error,
		debug: import_core.debug
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
	const helpers = {
		core: import_core,
		github,
		context,
		exec,
		logger,
		require: createRequire(resolve(process.cwd(), "package.json"))
	};
	let result;
	if (process.env.FILE) {
		const mod = await import(pathToFileURL(resolve(process.cwd(), process.env.FILE)).href);
		if (typeof mod.default !== "function") throw new Error("JavaScript file must export a default function");
		result = await mod.default(helpers);
	} else result = await new (Object.getPrototypeOf(async function() {})).constructor(...Object.keys(helpers), process.env.SCRIPT ?? "")(...Object.values(helpers));
	import_core.setOutput("result", JSON.stringify(result ?? null));
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
