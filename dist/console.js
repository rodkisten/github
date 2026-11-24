import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { readFile, writeFile } from "node:fs/promises";
import { t as require_core } from "./core-CtzvHsHd.js";
import { t as require_github } from "./github-W8iOYbtf.js";
import { n as formatFiles, r as listFiles } from "./format-BMsLyRWC.js";
import { a as style, i as logger, n as setOutputs, r as runAction, t as getInputs } from "./inputs-CY5RWTKN.js";
import { n as gitSync } from "./git-D7-Jsfse.js";
import { t as summary } from "./summary-DmC3uIL8.js";
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
function parseConsoleInputs() {
	const parsed = getInputs({
		defaults: { required: true },
		config: { default: ".github/rod-actions.yml" },
		"format-mode": { default: "off" },
		"format-scope": { default: "changed" },
		"format-base": { default: "origin/main" },
		"format-lint": {
			type: "boolean",
			default: true
		},
		"commit-files-path": { default: "" },
		"results-file": { default: "" },
		report: {
			type: "boolean",
			default: false
		},
		"github-token": {
			default: "",
			secret: true
		},
		"events-file": { default: "" }
	});
	return {
		defaultsPath: parsed.defaults,
		overridePath: parsed.config,
		formatMode: parsed["format-mode"],
		formatScope: parsed["format-scope"] === "all" ? "all" : "changed",
		formatBase: parsed["format-base"],
		formatLint: parsed["format-lint"],
		commitFilesPath: parsed["commit-files-path"],
		resultsFile: parsed["results-file"],
		report: parsed.report,
		githubToken: parsed["github-token"],
		eventsFile: parsed["events-file"]
	};
}
async function loadOptionalFile(filePath) {
	if (!filePath) return void 0;
	try {
		return await readFile(filePath, "utf8");
	} catch (error) {
		if (error.code === "ENOENT") {
			logger.debug(`Optional config file not found at "${filePath}", skipping.`);
			return;
		}
		throw error;
	}
}
async function runFormatStep(inputs) {
	if (!inputs.formatMode || inputs.formatMode === "off") {
		setOutputs({
			"format-changed-files": [],
			"format-results": [],
			"suggested-commit": ""
		});
		return;
	}
	await logger.step(`Run formatter (${inputs.formatMode})`, async () => {
		const mode = inputs.formatMode === "fix" ? "fix" : "check";
		logger.item("Scope", inputs.formatScope);
		logger.item("Base ref", inputs.formatBase);
		const targetFiles = listFiles(inputs.formatScope, inputs.formatBase);
		logger.item("Target files", targetFiles.length, true);
		const results = await logger.spin(`Executing format/lint on ${targetFiles.length} file(s)`, () => formatFiles(targetFiles, mode, inputs.formatLint));
		const changed = mode === "fix" ? gitSync(["diff", "--name-only"]).split("\n").filter(Boolean) : [];
		const suggestedCommit = `style(format): normalize ${changed.length || targetFiles.length} files [skip ci]`;
		if (inputs.commitFilesPath) {
			const payload = await Promise.all(changed.map(async (path) => ({
				path,
				content: await readFile(path, "utf8")
			})));
			await writeFile(inputs.commitFilesPath, JSON.stringify(payload));
			logger.item("Commit payload written to", inputs.commitFilesPath);
		}
		if (inputs.resultsFile) {
			await writeFile(inputs.resultsFile, JSON.stringify(results, null, 2));
			logger.item("Format results written to", inputs.resultsFile);
		}
		setOutputs({
			"format-changed-files": changed,
			"format-results": results,
			"suggested-commit": suggestedCommit
		});
		if (results.some((result) => result.status === "failed")) {
			logger.error("Formatting/lint issues detected");
			import_core.setFailed("Formatting/lint issues detected");
		} else logger.success(`Formatting/lint passed (${changed.length} file(s) modified)`);
	});
}
async function runReportStep(inputs, config) {
	if (!inputs.report) {
		logger.debug("Report mode disabled, skipping workflow run inspection.");
		return;
	}
	if (!inputs.githubToken) throw new Error("github-token required for report mode");
	const { owner, repo } = import_github.context.repo;
	const runId = import_github.context.runId;
	const client = import_github.getOctokit(inputs.githubToken);
	await logger.step("Inspect workflow run & generate report", async () => {
		const jobs = await logger.spin(`Listing jobs for run #${runId}`, () => client.paginate(client.rest.actions.listJobsForWorkflowRun, {
			owner,
			repo,
			run_id: runId,
			per_page: 100
		}));
		const events = selectEvents(config, jobs, `${owner}/${repo}`, runId);
		setOutputs({ "event-count": events.length });
		logger.item("Workflow jobs inspected", jobs.length);
		logger.item("Notification candidates", events.length, !inputs.eventsFile);
		if (inputs.eventsFile) {
			await writeFile(inputs.eventsFile, `${JSON.stringify(events, null, 2)}\n`);
			logger.item("Events exported to", inputs.eventsFile, true);
		}
		summary.heading("🧩 Rod Actions Console").text(`Notification candidates: **${events.length}**`);
		if (events.length > 0) summary.table(events.map((event) => ({
			Type: event.type,
			Target: String(event.step ?? event.jobId),
			Conclusion: String(event.conclusion ?? "unknown")
		})));
		await summary.write();
	});
}
runAction("Rod Actions Console", async () => {
	const { owner, repo } = import_github.context.repo;
	logger.banner("Rod Actions Console", `${owner}/${repo} · Run #${import_github.context.runId}`);
	const inputs = parseConsoleInputs();
	const config = await logger.step("Resolve console configuration", async () => {
		const defaults = await readFile(inputs.defaultsPath, "utf8");
		const override = await loadOptionalFile(inputs.overridePath);
		const resolved = resolveConfig(defaults, override);
		logger.item("Defaults path", inputs.defaultsPath);
		logger.item("Override path", override ? inputs.overridePath : "none");
		logger.item("Notify enabled", resolved.notify.enabled);
		logger.item("Release mode", resolved.release.mode, true);
		setOutputs({
			"notify-enabled": resolved.notify.enabled,
			"release-mode": resolved.release.mode
		});
		return resolved;
	});
	await runFormatStep(inputs);
	await runReportStep(inputs, config);
	logger.divider("Status");
	logger.success(`Console execution completed (${style.bold(config.release.mode)})`);
	logger.divider("", "═");
});
export {};
