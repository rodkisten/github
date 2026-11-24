import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";
import { a as style, i as logger } from "./inputs-DOIaVO8E.js";
// src/utils/git.ts
function gitSync(args, cwd = process.cwd()) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8"
	}).trim();
}
function listTrackedFiles(cwd = process.cwd()) {
	const raw = execFileSync("git", ["ls-files", "-z"], { cwd });
	return [...new Set(raw.toString("utf8").split("\0").filter(Boolean))].filter((f) => existsSync(f)).sort();
}
function listChangedFiles(baseRef, cwd = process.cwd()) {
	const raw = execFileSync("git", [
		"diff",
		"--name-only",
		"--diff-filter=ACMR",
		"-z",
		`${baseRef}...HEAD`
	], { cwd });
	return [...new Set(raw.toString("utf8").split("\0").filter(Boolean))].filter((f) => existsSync(f)).sort();
}
function listWorkspaceChanges(baseRef = "HEAD", cwd = process.cwd()) {
	const tracked = execFileSync("git", [
		"diff",
		"--name-only",
		"-z",
		baseRef,
		"--"
	], { cwd }).toString("utf8").split("\0").filter(Boolean);
	const untracked = execFileSync("git", [
		"ls-files",
		"--others",
		"--exclude-standard",
		"-z"
	], { cwd }).toString("utf8").split("\0").filter(Boolean);
	return [.../* @__PURE__ */ new Set([...tracked, ...untracked])].sort();
}
function validateBranchName(branch) {
	const forbidden = [...branch].some((character) => character.charCodeAt(0) <= 32 || (" ~^:?*[]" + String.fromCharCode(92)).includes(character));
	if (!branch || branch.startsWith("/") || branch.endsWith("/") || branch.includes("//") || branch.includes("..") || branch.includes("@{") || forbidden || branch.split("/").some((segment) => segment.startsWith(".") || segment.endsWith(".lock"))) throw new Error(`Invalid Git branch name: ${branch}`);
}
async function getBranchSha(octokit, owner, repo, branch) {
	try {
		return (await octokit.rest.git.getRef({
			owner,
			repo,
			ref: `heads/${branch}`
		})).data.object.sha;
	} catch (error) {
		if (error.status === 404) return;
		throw error;
	}
}
async function ensureBranchRef(octokit, owner, repo, branch, base) {
	const existingSha = await getBranchSha(octokit, owner, repo, branch);
	if (existingSha) return {
		sha: existingSha,
		created: false
	};
	const baseSha = await getBranchSha(octokit, owner, repo, base);
	if (!baseSha) throw new Error(`Cannot find base branch: ${base}`);
	await octokit.rest.git.createRef({
		owner,
		repo,
		ref: `refs/heads/${branch}`,
		sha: baseSha
	});
	return {
		sha: baseSha,
		created: true
	};
}
async function commitViaGitDatabase(octokit, options) {
	const { owner, repo, branch, base, message, authorName, authorEmail, files, workspacePaths, createBranchIfMissing = true } = options;
	let parentSha;
	let createdBranch = false;
	if (createBranchIfMissing) {
		const ensured = await logger.spin(`Resolving branch "${branch}" from "${base}"`, () => ensureBranchRef(octokit, owner, repo, branch, base));
		parentSha = ensured.sha;
		createdBranch = ensured.created;
	} else {
		const existing = await getBranchSha(octokit, owner, repo, branch);
		if (!existing) throw new Error(`Target branch not found: ${branch}`);
		parentSha = existing;
	}
	logger.item("Target branch", `${branch} (${createdBranch ? `created from ${base}` : "existing"})`, true);
	const parentCommit = await octokit.rest.git.getCommit({
		owner,
		repo,
		commit_sha: parentSha
	});
	const treeEntries = [];
	if (files && files.length > 0) await logger.spin(`Creating ${files.length} Git blob(s) from payload`, async () => {
		for (const file of files) {
			if (file.delete) {
				treeEntries.push({
					path: file.path,
					mode: "100644",
					type: "blob",
					sha: null
				});
				continue;
			}
			const blob = await octokit.rest.git.createBlob({
				owner,
				repo,
				content: file.content ?? "",
				encoding: file.encoding === "base64" ? "base64" : "utf-8"
			});
			treeEntries.push({
				path: file.path,
				mode: "100644",
				type: "blob",
				sha: blob.data.sha
			});
		}
	});
	else if (workspacePaths && workspacePaths.length > 0) await logger.spin(`Creating Git blobs from ${workspacePaths.length} workspace path(s)`, async () => {
		for (const filePath of workspacePaths) {
			if (!existsSync(filePath)) {
				treeEntries.push({
					path: filePath,
					mode: "100644",
					type: "blob",
					sha: null
				});
				continue;
			}
			const stat = lstatSync(filePath);
			if (stat.isDirectory()) continue;
			const mode = stat.isSymbolicLink() ? "120000" : (stat.mode & 73) !== 0 ? "100755" : "100644";
			const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(filePath)) : readFileSync(filePath);
			const blob = await octokit.rest.git.createBlob({
				owner,
				repo,
				content: bytes.toString("base64"),
				encoding: "base64"
			});
			treeEntries.push({
				path: filePath,
				mode,
				type: "blob",
				sha: blob.data.sha
			});
		}
	});
	else throw new Error("No files or workspace paths provided for commit");
	const tree = await logger.spin("Building Git tree", () => octokit.rest.git.createTree({
		owner,
		repo,
		base_tree: parentCommit.data.tree.sha,
		tree: treeEntries
	}));
	const commit = await logger.spin("Writing commit object", () => octokit.rest.git.createCommit({
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
	}));
	await logger.spin(`Updating ref heads/${branch}`, () => octokit.rest.git.updateRef({
		owner,
		repo,
		ref: `heads/${branch}`,
		sha: commit.data.sha,
		force: false
	}));
	logger.item("Commit SHA", style.bold(commit.data.sha.slice(0, 7)));
	logger.item("Files committed", treeEntries.length, true);
	return {
		sha: commit.data.sha,
		branch,
		filesCount: treeEntries.length,
		createdBranch
	};
}
export { listWorkspaceChanges as a, listTrackedFiles as i, gitSync as n, validateBranchName as o, listChangedFiles as r, commitViaGitDatabase as t };
