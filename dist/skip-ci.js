import { t as context } from "./github-DeG2mx_2.js";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-EIoaNpAD.js";
import { t as summary } from "./summary-Dq1J9BUu.js";
// src/skip-ci/rules.ts
function evaluateSkipCi(commitMessage, actor, skipBots) {
	if (/\[(skip\s+ci|ci\s+skip)\]/i.test(commitMessage)) return {
		skip: true,
		reason: "commit-marker"
	};
	if (skipBots && actor.endsWith("[bot]")) return {
		skip: true,
		reason: "bot-actor"
	};
	return {
		skip: false,
		reason: "normal"
	};
}
// src/skip-ci/index.ts
runAction("Skip CI Decision", async () => {
	const { owner, repo } = context.repo;
	logger.banner("Skip CI Decision", `${owner}/${repo}`);
	const inputs = await logger.step("Evaluate skip rules", () => {
		const parsed = getInputs({
			"commit-message": { required: true },
			actor: { default: context.actor || "" },
			"skip-bots": {
				type: "boolean",
				default: false
			}
		});
		const decision = evaluateSkipCi(parsed["commit-message"], parsed.actor, parsed["skip-bots"]);
		logger.item("Actor", parsed.actor || "unknown");
		logger.item("Skip bots", parsed["skip-bots"]);
		logger.item("Decision", decision.skip ? `SKIP (${decision.reason})` : "RUN", true);
		return decision;
	});
	setOutputs({
		skip: inputs.skip,
		reason: inputs.reason
	});
	await summary.publish("⏭️ Skip CI Decision", [{ kv: {
		Skip: inputs.skip ? "✅ Yes" : "▶️ No",
		Reason: inputs.reason
	} }]);
	logger.success(inputs.skip ? `Skipping expensive CI jobs (${style.bold(inputs.reason)})` : "Proceeding with standard CI execution");
	logger.divider("", "═");
});
export {};
