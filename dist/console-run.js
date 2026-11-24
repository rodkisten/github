import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { a as style, i as logger, n as setOutputs, o as require_core, r as runAction, t as getInputs } from "./inputs-DOIaVO8E.js";
import { t as summary } from "./summary-BYFxrPwG.js";
import { r as runCommand } from "./cmd-DSJikFMl.js";
// src/console/run-command.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
// src/console/runner.ts
runAction("Shell Command", async () => {
	const inputs = getInputs({
		command: { required: true },
		shell: { default: "/bin/bash" },
		title: { default: "Shell command" }
	});
	logger.banner(inputs.title, `Shell: ${inputs.shell}`);
	const result = await logger.step(inputs.title, async () => {
		logger.item("Shell", inputs.shell);
		logger.item("Command", style.cyan(inputs.command), true);
		const execResult = await runCommand(inputs.command, inputs.shell);
		logger.item("Exit code", execResult.exitCode);
		logger.item("Duration", `${execResult.durationMs}ms`, true);
		return execResult;
	}, { isSuccess: (result) => result.exitCode === 0 });
	logger.divider("Outputs & Summary");
	setOutputs({
		"exit-code": result.exitCode,
		"duration-ms": result.durationMs
	});
	await summary.heading(inputs.title, 3).kv({
		Status: result.exitCode === 0 ? "✅ Success" : `❌ Failed (${result.exitCode})`,
		"Exit code": result.exitCode,
		Duration: `${result.durationMs} ms`
	}).write();
	if (result.exitCode !== 0) {
		const failMessage = `${inputs.title} failed with exit code ${result.exitCode}`;
		logger.error(failMessage, inputs.title);
		import_core.setFailed(failMessage);
		return;
	}
	logger.success(`${inputs.title} completed in ${style.bold(`${result.durationMs}ms`)}`);
	logger.divider("", "═");
});
export {};
