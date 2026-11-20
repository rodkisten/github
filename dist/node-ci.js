import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CD-a993g.js";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
// src/node-ci/runner.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
async function execute(command, cwd, shell = process.platform === "win32" ? "cmd.exe" : "/bin/bash", env = process.env) {
	const started = Date.now();
	const child = spawn(command, {
		cwd,
		shell,
		stdio: "inherit",
		env
	});
	return {
		command,
		exitCode: await new Promise((done, reject) => {
			child.once("error", reject);
			child.once("close", (code, signal) => signal ? reject(/* @__PURE__ */ new Error(`Command terminated by ${signal}`)) : done(code ?? 1));
		}),
		durationMs: Date.now() - started
	};
}
// src/node-ci/tasks.ts
function getTasks(getInput, getBooleanInput) {
	return [
		{
			name: "test",
			enabled: getBooleanInput("run-tests"),
			command: getInput("test-command")
		},
		{
			name: "build",
			enabled: getBooleanInput("run-build"),
			command: getInput("build-command")
		},
		{
			name: "lint",
			enabled: getBooleanInput("run-lint"),
			command: getInput("lint-command")
		}
	];
}
// src/node-ci/index.ts
async function main() {
	const cwd = resolve(import_core.getInput("working-directory") || ".");
	const scope = import_core.getInput("scope");
	const commandEnv = {
		...process.env,
		...scope ? { ROD_CI_FILTER: scope } : {}
	};
	const tasks = getTasks(import_core.getInput, import_core.getBooleanInput);
	const results = [];
	let failure;
	const skipped = [];
	for (const task of tasks) {
		if (!task.enabled) {
			skipped.push(task.name);
			continue;
		}
		if (!task.command.trim()) {
			failure = /* @__PURE__ */ new Error(`Missing ${task.name} command`);
			break;
		}
		import_core.startGroup(`🟦 ${task.name}: ${task.command}`);
		try {
			const result = await execute(task.command, cwd, void 0, commandEnv);
			results.push({
				name: task.name,
				...result
			});
			if (result.exitCode !== 0) {
				failure = /* @__PURE__ */ new Error(`${task.name} exited with code ${result.exitCode}`);
				break;
			}
		} catch (error) {
			failure = error instanceof Error ? error : new Error(String(error));
			break;
		} finally {
			import_core.endGroup();
		}
	}
	await import_core.summary.addHeading("🟦 Shared Node CI").addTable([[
		{
			data: "Task",
			header: true
		},
		{
			data: "Exit",
			header: true
		},
		{
			data: "Duration (ms)",
			header: true
		}
	], ...results.map((r) => [
		r.name,
		String(r.exitCode),
		String(r.durationMs)
	])]).addRaw(`Skipped: ${skipped.join(", ") || "none"}\n\nStatus: **${failure ? "failed" : "passed"}**\n`).write();
	if (failure) throw failure;
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
