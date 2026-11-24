import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_github } from "./github-W8iOYbtf.js";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-CY5RWTKN.js";
import { t as summary } from "./summary-DmC3uIL8.js";
import { t as createOrUpdatePullRequest } from "./operation-0m0FzR8I.js";
// src/create-pr/helpers.ts
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
function appendConversationUrl(body, url) {
	if (!url || body.includes(url)) return body;
	return [
		body.trim(),
		"## 💬 Conversation",
		url
	].filter(Boolean).join(String.fromCharCode(10, 10));
}
// src/create-pr/index.ts
runAction("Create or Update PR", async () => {
	const { owner, repo } = import_github.context.repo;
	logger.banner("Create or Update PR", `${owner}/${repo}`);
	const inputs = await logger.step("Validate PR inputs", () => {
		const parsed = getInputs({
			token: {
				required: true,
				secret: true
			},
			head: { required: true },
			base: { default: import_github.context.payload.repository?.default_branch || "main" },
			title: { required: true },
			body: { default: "" },
			draft: {
				type: "boolean",
				default: false
			},
			"update-existing": {
				type: "boolean",
				default: true
			},
			"conversation-url": { default: "" },
			labels: { type: "list" },
			reviewers: { type: "list" }
		});
		logger.item("Head", parsed.head);
		logger.item("Base", parsed.base);
		logger.item("Draft", parsed.draft);
		logger.item("Update existing", parsed["update-existing"], true);
		return parsed;
	});
	const octokit = import_github.getOctokit(inputs.token);
	const result = await createOrUpdatePullRequest(octokit, {
		owner,
		repo,
		head: inputs.head,
		base: inputs.base,
		title: inputs.title,
		body: appendConversationUrl(inputs.body, inputs["conversation-url"]),
		draft: inputs.draft,
		updateExisting: inputs["update-existing"],
		labels: inputs.labels,
		reviewers: inputs.reviewers
	});
	logger.divider("Outputs & Summary");
	setOutputs({
		number: result.number,
		url: result.url,
		created: result.created,
		updated: result.updated
	});
	await summary.publish("🤖 Pull request ready", [{ table: [{
		PR: `[#${result.number}](${result.url})`,
		Base: inputs.base,
		Result: result.created ? "Created" : "Updated"
	}] }]);
	logger.success(`Pull request #${result.number} ${result.created ? "created" : "updated"}: ${style.bold(result.url)}`);
	logger.divider("", "═");
});
export {};
