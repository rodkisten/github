import { a as __toESM, t as require_core } from "./core-B1pz-eBj.js";
import { t as require_github } from "./github-BIEQjGK6.js";
// src/commit/validate.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
function validateBranchName(branch) {
	const forbidden = [...branch].some((character) => character.charCodeAt(0) <= 32 || (" ~^:?*[]" + String.fromCharCode(92)).includes(character));
	if (!branch || branch.startsWith("/") || branch.endsWith("/") || branch.includes("//") || branch.includes("..") || branch.includes("@{") || forbidden || branch.split("/").some((segment) => segment.startsWith(".") || segment.endsWith(".lock"))) throw new Error("Invalid Git branch name: " + branch);
}
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
// src/commit/operation.ts
async function createAtomicCommit(octokit, options) {
	const { owner, repo, branch, base, message, files, authorName, authorEmail } = options;
	const baseRef = await octokit.rest.git.getRef({
		owner,
		repo,
		ref: `heads/${base}`
	});
	let parentSha;
	try {
		parentSha = (await octokit.rest.git.getRef({
			owner,
			repo,
			ref: `heads/${branch}`
		})).data.object.sha;
	} catch (error) {
		if (error.status !== 404) throw error;
		await octokit.rest.git.createRef({
			owner,
			repo,
			ref: `refs/heads/${branch}`,
			sha: baseRef.data.object.sha
		});
		parentSha = baseRef.data.object.sha;
	}
	const parent = await octokit.rest.git.getCommit({
		owner,
		repo,
		commit_sha: parentSha
	});
	const blobs = await Promise.all(files.map((file) => octokit.rest.git.createBlob({
		owner,
		repo,
		content: file.content,
		encoding: file.encoding === "base64" ? "base64" : "utf-8"
	})));
	const tree = await octokit.rest.git.createTree({
		owner,
		repo,
		base_tree: parent.data.tree.sha,
		tree: files.map((file, index) => ({
			path: file.path,
			mode: "100644",
			type: "blob",
			sha: blobs[index].data.sha
		}))
	});
	const commit = await octokit.rest.git.createCommit({
		owner,
		repo,
		message,
		tree: tree.data.sha,
		parents: [parentSha],
		author: {
			name: authorName,
			email: authorEmail
		},
		committer: {
			name: authorName,
			email: authorEmail
		}
	});
	await octokit.rest.git.updateRef({
		owner,
		repo,
		ref: `heads/${branch}`,
		sha: commit.data.sha,
		force: false
	});
	return {
		sha: commit.data.sha,
		branch,
		files: files.length
	};
}
// src/commit/index.ts
async function main() {
	const token = import_core.getInput("token", { required: true });
	import_core.setSecret(token);
	const octokit = import_github.getOctokit(token);
	const { owner, repo } = import_github.context.repo;
	const branch = import_core.getInput("branch", { required: true });
	const base = import_core.getInput("base") || import_github.context.payload.repository?.default_branch || "main";
	validateBranchName(branch);
	validateBranchName(base);
	const message = import_core.getInput("message", { required: true });
	const changes = JSON.parse(import_core.getInput("files", { required: true }));
	validateChanges(changes);
	const result = await createAtomicCommit(octokit, {
		owner,
		repo,
		branch,
		base,
		message,
		files: changes,
		authorName: import_core.getInput("author-name") || "Rod GitHub App",
		authorEmail: import_core.getInput("author-email") || "github-actions[bot]@users.noreply.github.com"
	});
	import_core.setOutput("sha", result.sha);
	import_core.setOutput("branch", branch);
	import_core.setOutput("files", String(result.files));
	await import_core.summary.addHeading("📝 App-authored commit").addTable([[
		{
			data: "Branch",
			header: true
		},
		{
			data: "Commit",
			header: true
		},
		{
			data: "Files",
			header: true
		}
	], [
		branch,
		result.sha,
		String(result.files)
	]]).write();
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
