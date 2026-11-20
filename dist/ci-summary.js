import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CD-a993g.js";
import { appendFile } from "node:fs/promises";
// src/ci-summary/index.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
async function main() {
	const title = import_core.getInput("title") || "CI report";
	const status = import_core.getInput("status", { required: true });
	const details = import_core.getInput("details");
	const repository = process.env.GITHUB_REPOSITORY || "unknown";
	const workflow = process.env.GITHUB_WORKFLOW || "unknown";
	const summary = process.env.GITHUB_STEP_SUMMARY;
	if (!summary) throw new Error("GITHUB_STEP_SUMMARY is not set");
	const safe = (value) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
	const markdown = [
		`## ${title}`,
		"",
		"| Repository | Workflow | Status |",
		"|---|---|---|",
		`| ${safe(repository)} | ${safe(workflow)} | ${safe(status)} |`,
		"",
		details,
		""
	].join("\n");
	await appendFile(summary, markdown, "utf8");
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
