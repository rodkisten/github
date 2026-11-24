import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { readFileSync } from "node:fs";
import { t as require_github } from "./github-8oLQSBhe.js";
import { i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-DOIaVO8E.js";
// src/preview-report/render.ts
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
const MARKER = "<!-- rod-preview-report:v1 -->";
const escapeText = (value) => value.replace(/[&<>]/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;"
})[c] ?? c).replace(/[\\`*_\[\]|]/g, (c) => "\\" + c).replace(/[\r\n]/g, " ");
function parseReport(value) {
	if (!value || typeof value !== "object") throw new Error("Invalid preview report");
	const r = value;
	if (typeof r.title !== "string" || !r.title.trim() || r.title.length > 200 || typeof r.url !== "string" || !/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s<>()]*)?$/.test(r.url) || typeof r.sha !== "string" || !/^[a-f0-9]{40}$/.test(r.sha) || ![
		"success",
		"failure",
		"pending"
	].includes(String(r.status))) throw new Error("Invalid preview report fields");
	return r;
}
function renderReport(r, repository, runId) {
	const status = {
		success: "✅ Verified",
		failure: "❌ Failed",
		pending: "⏳ Pending"
	}[r.status];
	return [
		MARKER,
		"## " + escapeText(r.title),
		"",
		"**Status:** " + status,
		"",
		...r.status === "success" ? ["[Open preview](" + r.url + ")", ""] : [],
		"| Revision | Workflow |",
		"| :-- | :-- |",
		"| [" + r.sha.slice(0, 7) + "](https://github.com/" + repository + "/commit/" + r.sha + ") | [Run](https://github.com/" + repository + "/actions/runs/" + runId + ") |",
		"",
		"_Managed by Rod Preview Report. Updated in place._"
	].join("\n");
}
// src/preview-report/index.ts
runAction("Rod Preview Report", async () => {
	const { owner, repo } = import_github.context.repo;
	const inputs = getInputs({
		"github-token": {
			required: true,
			secret: true
		},
		"pr-number": {
			required: true,
			parse: (raw) => {
				const n = Number(raw);
				if (!Number.isSafeInteger(n) || n <= 0) throw new Error("Invalid PR number");
				return n;
			}
		},
		"results-file": { required: true },
		"bot-login": { default: "github-actions[bot]" }
	});
	const report = parseReport(JSON.parse(readFileSync(inputs["results-file"], "utf8")));
	const api = import_github.getOctokit(inputs["github-token"]);
	const pull_number = inputs["pr-number"];
	const pr = await api.rest.pulls.get({
		owner,
		repo,
		pull_number
	});
	if (pr.data.state !== "open" || pr.data.head.sha !== report.sha) {
		logger.info("Skipping stale or closed PR report");
		return;
	}
	const login = inputs["bot-login"];
	const existing = (await api.paginate(api.rest.issues.listComments, {
		owner,
		repo,
		issue_number: pull_number,
		per_page: 100
	})).find((c) => c.body?.startsWith("<!-- rod-preview-report:v1 -->") && c.user?.login === login);
	const body = renderReport(report, owner + "/" + repo, import_github.context.runId);
	const result = existing ? await api.rest.issues.updateComment({
		owner,
		repo,
		comment_id: existing.id,
		body
	}) : await api.rest.issues.createComment({
		owner,
		repo,
		issue_number: pull_number,
		body
	});
	setOutputs({ "comment-url": result.data.html_url });
});
export {};
