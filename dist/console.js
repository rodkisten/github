import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { t as require_core } from "./core-CD-a993g.js";
import { t as require_github } from "./github-Vkd5loPv.js";
import { appendFile, readFile } from "node:fs/promises";
import { t as require_dist } from "./dist-CuFDtFt3.js";
// src/console/config.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
var import_github = /* @__PURE__ */ __toESM(require_github(), 1);
var import_dist = /* @__PURE__ */ __toESM(require_dist(), 1);
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function mergeConfig(base, override) {
	if (!record(base) || !record(override)) return override === void 0 ? base : override;
	const result = { ...base };
	for (const [key, value] of Object.entries(override)) {
		if (!(key in base)) throw new Error("Unknown config key: " + key);
		result[key] = mergeConfig(base[key], value);
	}
	return result;
}
function resolveConfig(defaultYaml, repositoryYaml) {
	const defaults = (0, import_dist.parse)(defaultYaml, { uniqueKeys: true });
	const overrides = repositoryYaml ? (0, import_dist.parse)(repositoryYaml, { uniqueKeys: true }) : void 0;
	if (!record(defaults)) throw new Error("Default configuration must be a mapping");
	if (overrides !== void 0 && !record(overrides)) throw new Error("Override must be a mapping");
	const config = mergeConfig(defaults, overrides);
	if (config.version !== 1) throw new Error("Unsupported configuration version");
	if (!["rodlog", "plain"].includes(config.console.renderer)) throw new Error("Invalid console renderer");
	if (!["relay", "none"].includes(config.notify.provider)) throw new Error("Invalid notification provider");
	if (![
		"hybrid",
		"semantic",
		"manual"
	].includes(config.release.mode)) throw new Error("Invalid release mode");
	if (!Number.isInteger(config.notify.debounceSeconds) || config.notify.debounceSeconds < 0 || config.notify.debounceSeconds > 3600) throw new Error("Invalid debounceSeconds");
	if (!/^\d+\.\d+\.\d+$/.test(config.release.initialVersion)) throw new Error("Invalid initialVersion");
	for (const events of [
		config.hooks.shell.notifyOn,
		config.hooks.github.notifyOn,
		config.notify.ignore,
		config.notify.groupBy
	]) if (!Array.isArray(events) || !events.every((x) => typeof x === "string")) throw new Error("Expected string array");
	for (const flag of [
		config.console.enabled,
		config.hooks.shell.enabled,
		config.hooks.github.enabled,
		config.notify.enabled
	]) if (typeof flag !== "boolean") throw new Error("Expected boolean flag");
	return config;
}
function eventDedupeKey(event) {
	return [
		event.repository,
		event.runId,
		event.jobId ?? "workflow",
		event.step ?? "-",
		event.type
	].join(":");
}
function shouldNotify(config, event) {
	if (!config.notify.enabled) return false;
	if (event.conclusion && config.notify.ignore.includes(event.conclusion)) return false;
	return config.hooks.github.enabled && config.hooks.github.notifyOn.includes(event.type);
}
// src/console/events.ts
function selectEvents(config, jobs, repository, runId) {
	const events = [];
	const add = (event) => {
		if (!shouldNotify(config, event)) return;
		events.push({
			...event,
			dedupeKey: eventDedupeKey({
				repository,
				runId,
				jobId: event.jobId,
				step: event.step,
				type: event.type
			})
		});
	};
	for (const job of jobs) {
		const url = job.html_url ?? "";
		for (const step of job.steps ?? []) {
			if (!step.conclusion) continue;
			add({
				type: step.conclusion === "failure" ? "step.failure" : "step.success",
				conclusion: step.conclusion,
				repository,
				runId,
				jobId: job.id,
				step: step.name,
				url,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			});
		}
		if (job.conclusion && job.status === "completed") add({
			type: "job.completed",
			conclusion: job.conclusion,
			repository,
			runId,
			jobId: job.id,
			url,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	return events;
}
// src/console/index.ts
async function main() {
	const defaults = await readFile(import_core.getInput("defaults", { required: true }), "utf8");
	const overridePath = import_core.getInput("config");
	let override;
	if (overridePath) try {
		override = await readFile(overridePath, "utf8");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const config = resolveConfig(defaults, override);
	import_core.setOutput("notify-enabled", String(config.notify.enabled));
	import_core.setOutput("release-mode", config.release.mode);
	if (!(import_core.getInput("report") === "true")) return;
	const token = import_core.getInput("github-token");
	if (!token) throw new Error("github-token required for report mode");
	const { owner, repo } = import_github.context.repo;
	const runId = import_github.context.runId;
	const client = import_github.getOctokit(token);
	const events = selectEvents(config, await client.paginate(client.rest.actions.listJobsForWorkflowRun, {
		owner,
		repo,
		run_id: runId,
		per_page: 100
	}), owner + "/" + repo, runId);
	import_core.setOutput("event-count", String(events.length));
	const summary = process.env.GITHUB_STEP_SUMMARY;
	if (summary) await appendFile(summary, [
		"## 🧩 Rod Actions Console",
		"",
		"Notification candidates: " + events.length,
		"",
		...events.map((event) => "- " + event.type + ": " + (event.step ?? event.jobId) + " (" + event.conclusion + ")"),
		""
	].join("\n"));
	const output = import_core.getInput("events-file");
	if (output) await (await import("node:fs/promises")).writeFile(output, JSON.stringify(events, null, 2) + "\n");
}
main().catch((error) => import_core.setFailed(error instanceof Error ? error.message : String(error)));
export {};
