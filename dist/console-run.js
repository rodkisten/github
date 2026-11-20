import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CD-a993g.js";
import { appendFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
// src/console/run-command.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
function runCommand(command, shell, env = process.env) {
	return new Promise((resolve, reject) => {
		const started = performance.now();
		const child = spawn(shell, [
			"-eo",
			"pipefail",
			"-c",
			command
		], {
			stdio: "inherit",
			env
		});
		child.once("error", reject);
		child.once("close", (code, signal) => {
			const durationMs = Math.round(performance.now() - started);
			if (signal) return reject(/* @__PURE__ */ new Error("Command terminated by signal " + signal));
			resolve({
				exitCode: code ?? 1,
				durationMs
			});
		});
	});
}
// src/console/runner.ts
async function main() {
	const command = import_core.getInput("command", { required: true });
	const shell = import_core.getInput("shell") || "/bin/bash";
	const title = import_core.getInput("title") || "Shell command";
	import_core.info("▶ " + title);
	const result = await runCommand(command, shell);
	import_core.setOutput("exit-code", String(result.exitCode));
	import_core.setOutput("duration-ms", String(result.durationMs));
	const summary = process.env.GITHUB_STEP_SUMMARY;
	if (summary) await appendFile(summary, [
		"### " + title,
		"",
		"- Exit: " + result.exitCode,
		"- Duration: " + result.durationMs + " ms",
		""
	].join("\n"));
	if (result.exitCode !== 0) import_core.setFailed(title + " failed with exit code " + result.exitCode);
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
