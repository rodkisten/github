import { a as __toESM, t as require_core } from "./core-B1pz-eBj.js";
import { t as require_github } from "./github-BIEQjGK6.js";
// src/create-pr/helpers.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
function parseList(value) {
	return value.split(/[\r\n,]/).map((item) => item.trim()).filter(Boolean);
}
function appendConversationUrl(body, url) {
	if (!url || body.includes(url)) return body;
	return [
		body.trim(),
		"## 💬 Conversation",
		url
	].filter(Boolean).join(String.fromCharCode(10, 10));
}
// src/create-pr/operation.ts
async function createOrUpdatePullRequest(octokit, options) {
	const { owner, repo, head, base, title, body, draft, updateExisting, labels, reviewers } = options;
	const existing = await octokit.paginate(octokit.rest.pulls.list, {
		owner,
		repo,
		state: "open",
		head: `${owner}:${head}`,
		base,
		per_page: 100
	});
	let number;
	let url;
	let created = false;
	if (existing[0]) {
		if (!updateExisting) throw new Error(`PR #${existing[0].number} already exists for ${head} → ${base}`);
		const response = await octokit.rest.pulls.update({
			owner,
			repo,
			pull_number: existing[0].number,
			title,
			body
		});
		number = response.data.number;
		url = response.data.html_url;
	} else {
		const response = await octokit.rest.pulls.create({
			owner,
			repo,
			head,
			base,
			title,
			body,
			draft
		});
		number = response.data.number;
		url = response.data.html_url;
		created = true;
	}
	if (labels.length) await octokit.rest.issues.addLabels({
		owner,
		repo,
		issue_number: number,
		labels
	});
	if (reviewers.length) await octokit.rest.pulls.requestReviewers({
		owner,
		repo,
		pull_number: number,
		reviewers
	});
	return {
		number,
		url,
		created,
		updated: !created
	};
}
// src/create-pr/index.ts
async function main() {
	const token = import_core.getInput("token", { required: true });
	import_core.setSecret(token);
	const octokit = import_github.getOctokit(token);
	const { owner, repo } = import_github.context.repo;
	const head = import_core.getInput("head", { required: true });
	const base = import_core.getInput("base") || import_github.context.payload.repository?.default_branch || "main";
	const title = import_core.getInput("title", { required: true });
	const draft = import_core.getBooleanInput("draft");
	const updateExisting = import_core.getBooleanInput("update-existing");
	const conversationUrl = import_core.getInput("conversation-url");
	const result = await createOrUpdatePullRequest(octokit, {
		owner,
		repo,
		head,
		base,
		title,
		body: appendConversationUrl(import_core.getInput("body"), conversationUrl),
		draft,
		updateExisting,
		labels: parseList(import_core.getInput("labels")),
		reviewers: parseList(import_core.getInput("reviewers"))
	});
	import_core.setOutput("number", String(result.number));
	import_core.setOutput("url", result.url);
	import_core.setOutput("created", String(result.created));
	import_core.setOutput("updated", String(result.updated));
	await import_core.summary.addHeading("🤖 Pull request ready").addTable([[
		{
			data: "PR",
			header: true
		},
		{
			data: "Base",
			header: true
		},
		{
			data: "Result",
			header: true
		}
	], [
		`[#${result.number}](${result.url})`,
		base,
		result.created ? "Created" : "Updated"
	]]).write();
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
