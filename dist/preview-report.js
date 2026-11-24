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
// src/preview-report/bundle.ts
function parseSnapshot(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid bundle snapshot");
	const entries = Object.entries(value);
	if (entries.length > 500) throw new Error("Too many bundle entries");
	for (const [name, size] of entries) if (!name || name.length > 500 || !size || typeof size !== "object" || ![
		"raw",
		"gzip",
		"brotli"
	].every((k) => Number.isSafeInteger(size[k]) && size[k] >= 0)) throw new Error("Invalid bundle size: " + name);
	return Object.fromEntries(entries);
}
const total = (snapshot) => Object.values(snapshot).reduce((a, b) => ({
	raw: a.raw + b.raw,
	gzip: a.gzip + b.gzip,
	brotli: a.brotli + b.brotli
}), {
	raw: 0,
	gzip: 0,
	brotli: 0
});
const kib = (n) => (n / 1024).toFixed(2) + " KiB";
const delta = (n, base) => {
	const d = n - base;
	return (d > 0 ? "+" : d < 0 ? "−" : "") + kib(Math.abs(d)) + (base ? " (" + (d / base * 100).toFixed(1) + "%)" : "");
};
function bundleSections(current, baseline) {
	const now = total(current);
	const before = baseline ? total(baseline) : void 0;
	const keys = [
		"raw",
		"gzip",
		"brotli"
	];
	return [
		{
			title: "Bundle totals",
			rows: keys.map((k) => ({
				label: k,
				value: kib(now[k]) + (before ? " · Δ " + delta(now[k], before[k]) : ""),
				...before ? { status: now[k] > before[k] ? "failure" : "success" } : {}
			}))
		},
		{
			title: "Bundle files (up to 40)",
			collapsed: true,
			rows: Object.keys(current).sort((a, b) => current[b].raw - current[a].raw).slice(0, 40).map((name) => ({
				label: name,
				value: keys.map((k) => k + ": " + kib(current[name][k])).join(" · ") + (baseline ? Object.hasOwn(baseline, name) ? " · raw Δ " + delta(current[name].raw, baseline[name].raw) : " · New file" : "")
			}))
		},
		...baseline ? [{
			title: "Removed bundles",
			collapsed: true,
			rows: Object.keys(baseline).filter((name) => !Object.hasOwn(current, name)).slice(0, 40).map((name) => ({
				label: name,
				value: kib(baseline[name].raw)
			}))
		}] : []
	];
}
// src/preview-report/git.ts
function gitSections(commits, files, totals) {
	const directories = /* @__PURE__ */ new Map();
	for (const file of files) {
		const directory = file.filename.includes("/") ? file.filename.split("/")[0] : "(root)";
		directories.set(directory, (directories.get(directory) ?? 0) + 1);
	}
	return [
		{
			title: "PR changes",
			rows: [
				{
					label: "Commits",
					value: String(totals.commits)
				},
				{
					label: "Files changed",
					value: String(totals.files)
				},
				{
					label: "Lines",
					value: "+" + totals.additions + " / -" + totals.deletions
				},
				{
					label: "File coverage",
					value: files.length + " of " + totals.files
				}
			]
		},
		{
			title: "Commits (up to 20)",
			collapsed: true,
			rows: commits.slice(-20).map((c) => ({
				label: c.sha.slice(0, 7),
				value: (c.commit.message.split("\n")[0] + " · " + (c.commit.author?.name ?? "Unknown")).slice(0, 500)
			}))
		},
		{
			title: "Changed files (up to 40)",
			collapsed: true,
			rows: files.slice(0, 40).map((f) => ({
				label: f.status,
				value: ((f.previous_filename ? f.previous_filename + " → " : "") + f.filename + " (+" + f.additions + " / -" + f.deletions + ")").slice(0, 500)
			}))
		},
		{
			title: "Top-level directories (retrieved files)",
			collapsed: true,
			rows: [...directories].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([label, count]) => ({
				label,
				value: String(count)
			}))
		}
	];
}
function previousVerifiedSha(body) {
	return body?.match(/^<!-- rod-preview-verified-sha:([a-f0-9]{40}) -->$/m)?.[1];
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
		"bundle-file": { default: "" },
		"baseline-file": { default: "" },
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
	const params = {
		owner,
		repo,
		pull_number,
		per_page: 100
	};
	const [commits, files] = await Promise.all([api.paginate(api.rest.pulls.listCommits, params), api.paginate(api.rest.pulls.listFiles, params)]);
	const sections = gitSections(commits, files, {
		commits: pr.data.commits,
		files: pr.data.changed_files,
		additions: pr.data.additions,
		deletions: pr.data.deletions
	});
	if (inputs["bundle-file"]) {
		const current = parseSnapshot(JSON.parse(readFileSync(inputs["bundle-file"], "utf8")));
		const baseline = inputs["baseline-file"] ? parseSnapshot(JSON.parse(readFileSync(inputs["baseline-file"], "utf8"))) : void 0;
		sections.push(...bundleSections(current, baseline));
	}
	const previous = previousVerifiedSha(existing?.body ?? void 0);
	if (previous && previous !== report.sha) try {
		const comparison = await api.rest.repos.compareCommits({
			owner,
			repo,
			base: previous,
			head: report.sha,
			per_page: 1
		});
		sections.push({
			title: "Since last verified preview",
			rows: [
				{
					label: "Previous revision",
					value: previous.slice(0, 7)
				},
				{
					label: "Comparison",
					value: comparison.data.status
				},
				{
					label: "Ahead / behind",
					value: comparison.data.ahead_by + " / " + comparison.data.behind_by
				}
			]
		});
	} catch {
		sections.push({
			title: "Since last verified preview",
			rows: [{
				label: "Comparison",
				value: "Unavailable"
			}]
		});
	}
	const latest = await api.rest.pulls.get({
		owner,
		repo,
		pull_number
	});
	if (latest.data.state !== "open" || latest.data.head.sha !== report.sha || latest.data.base.sha !== pr.data.base.sha) {
		logger.info("Skipping report because PR changed during collection");
		return;
	}
	const verified = report.status === "success" ? report.sha : previous;
	const body = renderReport({
		...report,
		sections: [...report.sections ?? [], ...sections]
	}, owner + "/" + repo, import_github.context.runId) + (verified ? "\n<!-- rod-preview-verified-sha:" + verified + " -->" : "");
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
