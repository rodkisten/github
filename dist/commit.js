import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { readFileSync } from "node:fs";
import { t as require_github } from "./github-W8iOYbtf.js";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-CY5RWTKN.js";
import { o as validateBranchName, t as commitViaGitDatabase } from "./git-D7-Jsfse.js";
import { t as summary } from "./summary-DmC3uIL8.js";
// src/commit/operation.ts
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
async function createAtomicCommit(octokit, options) {
	const { owner, repo, branch, base, message, files, authorName, authorEmail } = options;
	return logger.step(`Create atomic commit on ${branch}`, async () => {
		const result = await commitViaGitDatabase(octokit, {
			owner,
			repo,
			branch,
			base,
			message,
			authorName,
			authorEmail,
			files,
			createBranchIfMissing: true
		});
		return {
			sha: result.sha,
			branch: result.branch,
			files: result.filesCount
		};
	});
}
// src/commit/validate.ts
function validateChanges(changes) {
	if (!Array.isArray(changes) || changes.length === 0) throw new Error("files must be a non-empty JSON array");
	const seen = /* @__PURE__ */ new Set();
	for (const file of changes) {
		if (!file || typeof file.path !== "string" || !file.path.trim() || file.path.startsWith("/") || file.path.split("/").includes("..")) throw new Error("Unsafe file path: " + file?.path);
		if (seen.has(file.path)) throw new Error("Duplicate file path: " + file.path);
		seen.add(file.path);
		if (typeof file.content !== "string") throw new Error("Missing content for " + file.path);
		if (file.encoding && file.encoding !== "utf-8" && file.encoding !== "base64") throw new Error("Unsupported encoding for " + file.path);
	}
}
// src/commit/index.ts
runAction("App-Authored Commit", async () => {
	const { owner, repo } = import_github.context.repo;
	logger.banner("App-Authored Commit", `${owner}/${repo}`);
	const inputs = await logger.step("Validate inputs & file changes", () => {
		const parsed = getInputs({
			token: {
				required: true,
				secret: true
			},
			branch: { required: true },
			base: { default: import_github.context.payload.repository?.default_branch || "main" },
			message: { required: true },
			files: { default: "" },
			"files-path": { default: "" },
			"author-name": { default: "Rod GitHub App" },
			"author-email": { default: "github-actions[bot]@users.noreply.github.com" }
		});
		validateBranchName(parsed.branch);
		validateBranchName(parsed.base);
		const rawJson = parsed["files-path"] ? readFileSync(parsed["files-path"], "utf8") : parsed.files;
		if (!rawJson) throw new Error("Either \"files\" or \"files-path\" input is required");
		const fileChanges = JSON.parse(rawJson);
		validateChanges(fileChanges);
		logger.item("Target branch", parsed.branch);
		logger.item("Base branch", parsed.base);
		logger.item("Author", `${parsed["author-name"]} <${parsed["author-email"]}>`);
		logger.item("Files to commit", fileChanges.length, true);
		return {
			...parsed,
			fileChanges
		};
	});
	const result = await createAtomicCommit(import_github.getOctokit(inputs.token), {
		owner,
		repo,
		branch: inputs.branch,
		base: inputs.base,
		message: inputs.message,
		files: inputs.fileChanges,
		authorName: inputs["author-name"],
		authorEmail: inputs["author-email"]
	});
	logger.divider("Outputs & Job Summary");
	setOutputs({
		sha: result.sha,
		branch: inputs.branch,
		files: result.files
	});
	await summary.publish("📝 App-authored commit", [{ table: [{
		Branch: inputs.branch,
		Commit: result.sha,
		Files: result.files
	}] }]);
	logger.success(`Committed ${result.files} file(s) to ${style.bold(inputs.branch)}`);
	logger.divider("", "═");
});
export {};
