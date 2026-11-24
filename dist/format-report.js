import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { readFileSync } from "node:fs";
import { t as require_github } from "./github-W8iOYbtf.js";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-CY5RWTKN.js";
import { n as gitSync } from "./git-D7-Jsfse.js";
// src/format/report.ts
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
const MARKER = "<!-- rod-format-report -->";
function reportMarkdown(results, changed, mode, scope) {
	const counts = {
		ok: results.filter((x) => x.status === "ok").length,
		failed: results.filter((x) => x.status === "failed").length,
		skipped: results.filter((x) => x.status === "skipped").length
	};
	const commit = `style(format): normalize ${changed.length} files [skip ci]`;
	return [
		MARKER,
		`## 🎨 Rod Format · ${mode.toUpperCase()}`,
		"",
		`> **Scope:** \`${scope}\` · **Tools passed:** ${counts.ok} · **Failed:** ${counts.failed} · **Skipped:** ${counts.skipped}`,
		"",
		"| Language | Tool | Files | Status |",
		"|:--|:--|--:|:--|",
		...results.map((x) => `| ${x.language} | ${x.tool} | ${x.files} | ${x.status === "ok" ? "✅" : x.status === "failed" ? "❌" : "⚠️"} ${x.status} |`),
		"",
		`<details><summary>📂 Files changed (${changed.length})</summary>`,
		"",
		...changed.map((x) => `- \`${x.replaceAll("`", "")}\``),
		"",
		"</details>",
		"",
		"### 📝 Suggested commit",
		"",
		"```text",
		commit,
		"```",
		"",
		...results.filter((x) => x.status !== "ok").map((x) => `<details><summary>${x.status === "failed" ? "❌" : "⚠️"} ${x.tool}</summary>\n\n\`\`\`text\n${(x.detail || x.status).replaceAll("```", "")}\n\`\`\`\n</details>`),
		"",
		"_Updated by Rod Actions Console. This comment is edited in place._"
	].join("\n");
}
async function runFormatReportAction() {
	const { owner, repo } = import_github.context.repo;
	const inputs = getInputs({
		"github-token": {
			required: true,
			secret: true
		},
		"pr-number": {
			required: true,
			parse: (raw) => {
				const pull = Number(raw);
				if (!Number.isSafeInteger(pull) || pull <= 0) throw new Error(`Invalid PR number: ${raw}`);
				return pull;
			}
		},
		"results-file": { required: true },
		mode: { default: "check" },
		scope: { default: "changed" }
	});
	logger.banner("Rod Format PR Report", `${owner}/${repo} · PR #${inputs["pr-number"]}`);
	const body = await logger.step("Build PR report markdown", () => {
		const results = JSON.parse(readFileSync(inputs["results-file"], "utf8"));
		const changed = gitSync([
			"diff",
			"--name-only",
			"HEAD"
		]).split("\n").filter(Boolean);
		logger.item("Results file", inputs["results-file"]);
		logger.item("Tool entries", results.length);
		logger.item("Changed files", changed.length, true);
		return reportMarkdown(results, changed, inputs.mode, inputs.scope);
	});
	const octokit = import_github.getOctokit(inputs["github-token"]);
	await logger.step("Upsert sticky PR comment", async () => {
		const existing = (await logger.spin(`Fetching comments on PR #${inputs["pr-number"]}`, () => octokit.paginate(octokit.rest.issues.listComments, {
			owner,
			repo,
			issue_number: inputs["pr-number"],
			per_page: 100
		}))).find((c) => c.body?.includes(MARKER) && c.user?.type === "Bot");
		if (existing) {
			await logger.spin(`Updating existing comment #${existing.id}`, () => octokit.rest.issues.updateComment({
				owner,
				repo,
				comment_id: existing.id,
				body
			}));
			logger.item("Action", style.cyan(`Updated comment #${existing.id}`), true);
		} else {
			const created = await logger.spin("Creating new sticky PR comment", () => octokit.rest.issues.createComment({
				owner,
				repo,
				issue_number: inputs["pr-number"],
				body
			}));
			logger.item("Action", style.green(`Created comment #${created.data.id}`), true);
		}
	});
	setOutputs({ "comment-updated": true });
	logger.success(`PR #${inputs["pr-number"]} format report synchronized`);
	logger.divider("", "═");
}
runAction("Rod Format PR Report", runFormatReportAction);
export { reportMarkdown, runFormatReportAction };
