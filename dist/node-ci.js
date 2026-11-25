import { resolve } from "node:path";
import { a as style, i as logger, r as runAction, t as getInputs } from "./inputs-EIoaNpAD.js";
import { t as summary } from "./summary-Dq1J9BUu.js";
import { n as cmd, t as DEFAULT_SHELL } from "./cmd-Cu_ZwOYu.js";
// src/node-ci/runner.ts
async function execute(command, cwd = process.cwd(), shell = DEFAULT_SHELL, env = process.env) {
	const { exitCode, durationMs } = await cmd(command, {
		cwd,
		shell,
		env,
		stdio: "inherit",
		rejectOnNonZero: false
	});
	return {
		exitCode,
		durationMs
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
runAction("TypeScript Node CI", async () => {
	const inputs = getInputs({
		"working-directory": { default: "." },
		scope: { default: "" },
		"test-command": { default: "npm test" },
		"build-command": { default: "npm run build" },
		"lint-command": { default: "npm run lint" },
		"run-tests": {
			type: "boolean",
			default: true
		},
		"run-build": {
			type: "boolean",
			default: true
		},
		"run-lint": {
			type: "boolean",
			default: false
		}
	});
	const cwd = resolve(inputs["working-directory"]);
	const scope = inputs.scope;
	const commandEnv = {
		...process.env,
		...scope ? { ROD_CI_FILTER: scope } : {}
	};
	logger.banner("TypeScript Node CI", `${scope ? `Filter: ${scope} · ` : ""}${inputs["working-directory"]}`);
	const tasks = getTasks((name) => String(inputs[name] ?? ""), (name) => Boolean(inputs[name]));
	const results = [];
	let failure;
	const skipped = [];
	for (const task of tasks) {
		if (!task.enabled) {
			skipped.push(task.name);
			logger.debug(`Skipping disabled task: ${task.name}`);
			continue;
		}
		if (!task.command.trim()) {
			failure = /* @__PURE__ */ new Error(`Missing ${task.name} command`);
			break;
		}
		try {
			await logger.step(`${task.name.toUpperCase()}: ${task.command}`, async () => {
				logger.item("Working directory", cwd);
				if (scope) logger.item("Filter scope", scope);
				const execRes = await execute(task.command, cwd, void 0, commandEnv);
				logger.item("Exit code", execRes.exitCode);
				logger.item("Duration", `${execRes.durationMs}ms`, true);
				results.push({
					name: task.name,
					...execRes
				});
				if (execRes.exitCode !== 0) throw new Error(`${task.name} exited with code ${execRes.exitCode}`);
			});
		} catch (error) {
			failure = error instanceof Error ? error : new Error(String(error));
			break;
		}
	}
	await summary.publish("🟦 Shared Node CI", [{ table: results.map((r) => ({
		Task: r.name,
		Exit: r.exitCode,
		"Duration (ms)": r.durationMs
	})) }, { text: `Skipped: ${skipped.join(", ") || "none"}\n\nStatus: **${failure ? "failed" : "passed"}**` }]);
	if (failure) throw failure;
	logger.success(`All enabled CI tasks passed in ${style.bold(inputs["working-directory"])}`);
	logger.divider("", "═");
});
export {};
