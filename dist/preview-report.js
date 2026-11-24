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
const safeUrl = (v) => typeof v === "string" && /^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s<>()\[\]\\]*)?$/.test(v);
const boundedText = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const validStatus = (v) => v === "success" || v === "failure" || v === "pending";
function parseReport(value) {
	if (!value || typeof value !== "object") throw new Error("Invalid preview report");
	const r = value;
	if (typeof r.title !== "string" || !r.title.trim() || r.title.length > 200 || typeof r.url !== "string" || !/^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s<>()]*)?$/.test(r.url) || typeof r.sha !== "string" || !/^[a-f0-9]{40}$/.test(r.sha) || ![
		"success",
		"failure",
		"pending"
	].includes(String(r.status))) throw new Error("Invalid preview report fields");
	if (r.banner !== void 0 && !safeUrl(r.banner)) throw new Error("Invalid banner URL");
	if (r.description !== void 0 && !boundedText(r.description, 1e3)) throw new Error("Invalid description");
	if (r.links !== void 0 && (!Array.isArray(r.links) || r.links.length > 10 || !r.links.every((l) => l && boundedText(l.label, 100) && safeUrl(l.url)))) throw new Error("Invalid report links");
	if (r.sections !== void 0 && (!Array.isArray(r.sections) || r.sections.length > 10 || !r.sections.every((s) => s && boundedText(s.title, 100) && (s.collapsed === void 0 || typeof s.collapsed === "boolean") && Array.isArray(s.rows) && s.rows.length <= 20 && s.rows.every((row) => row && boundedText(row.label, 100) && boundedText(row.value, 500) && (row.status === void 0 || validStatus(row.status)))))) throw new Error("Invalid report sections");
	return r;
}
function renderReport(r, repository, runId) {
	const status = {
		success: "✅ Verified",
		failure: "❌ Failed",
		pending: "⏳ Pending"
	}[r.status];
	const icons = {
		success: "✅ ",
		failure: "❌ ",
		pending: "⏳ "
	};
	const sections = (r.sections ?? []).flatMap((s) => [
		...s.collapsed ? ["<details><summary>" + escapeText(s.title) + "</summary>", ""] : ["### " + escapeText(s.title), ""],
		"| Metric | Value |",
		"| :-- | :-- |",
		...s.rows.map((row) => "| " + escapeText(row.label) + " | " + (row.status ? icons[row.status] : "") + escapeText(row.value) + " |"),
		"",
		...s.collapsed ? ["</details>", ""] : []
	]);
	return [
		MARKER,
		...r.banner ? ["![Preview banner](" + r.banner + ")", ""] : [],
		"## " + escapeText(r.title),
		"",
		...r.description ? [escapeText(r.description), ""] : [],
		"**Status:** " + status,
		"",
		...r.status === "success" ? ["[Open preview](" + r.url + ")", ""] : [],
		"| Revision | Workflow |",
		"| :-- | :-- |",
		"| [" + r.sha.slice(0, 7) + "](https://github.com/" + repository + "/commit/" + r.sha + ") | [Run](https://github.com/" + repository + "/actions/runs/" + runId + ") |",
		"",
		...sections,
		...r.links?.length ? [
			"### Resources",
			"",
			...r.links.map((l) => "- [" + escapeText(l.label) + "](" + l.url + ")"),
			""
		] : [],
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
