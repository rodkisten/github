import { r as __toESM } from "./rolldown-runtime-DegdyBIC.js";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { a as style, i as logger, n as setOutputs, o as require_core, r as runAction, t as getInputs } from "./inputs-BuTruFqa.js";
import { n as cmd } from "./cmd-Dfr8Spx5.js";
import { t as summary } from "./summary-Cb6mg204.js";
// src/setup-rodlog/index.ts
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
function resolvePlatformBinary() {
	const platform = process.platform;
	const arch = process.arch;
	const osMap = {
		linux: "linux",
		darwin: "darwin"
	};
	const archMap = {
		x64: "amd64",
		arm64: "arm64"
	};
	const os = osMap[platform];
	const cpu = archMap[arch];
	if (!os) throw new Error(`Unsupported OS for rodlog: ${platform}`);
	if (!cpu) throw new Error(`Unsupported architecture for rodlog: ${arch}`);
	return `rodlog_${os}_${cpu}`;
}
function printFallbackWarningBox(attemptedUrl, reason) {
	const border = "═".repeat(76);
	const padLine = (text) => {
		return `║ ${text.slice(0, 74).padEnd(74)} ║`;
	};
	const box = [
		"",
		`╔${border}╗`,
		padLine("⚠️  AVISO: USANDO FALLBACK TRANSPARENTE DO RODLOG"),
		`╠${border}╣`,
		padLine("Não foi possível baixar ou validar o binário oficial do rodlog."),
		padLine(`URL tentada: ${attemptedUrl}`),
		padLine(`Motivo: ${reason}`),
		padLine(""),
		padLine("Um wrapper transparente foi criado: tudo após \"--\" será executado"),
		padLine("diretamente sem interromper o pipeline."),
		`╚${border}╝`,
		""
	].join("\n");
	console.warn(style.yellow ? style.yellow(style.bold(box)) : box);
	import_core.warning(`[rodlog fallback] Falha ao baixar de ${attemptedUrl} (${reason}). Usando wrapper transparente.`);
}
function installFallbackScript(targetPath) {
	writeFileSync(targetPath, `#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const dashDashIndex = args.indexOf('--');
const commandArgs = dashDashIndex !== -1 ? args.slice(dashDashIndex + 1) : args;

if (commandArgs.length === 0) {
  console.warn('[rodlog-fallback] Nenhum comando encontrado após "--".');
  process.exit(0);
}

const [command, ...cmdArgs] = commandArgs;
const result = spawnSync(command, cmdArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(\`[rodlog-fallback] Erro ao executar "\${command}": \${result.error.message}\`);
  process.exit(1);
}

process.exit(result.status ?? 1);
`, "utf8");
	chmodSync(targetPath, 493);
}
runAction("Setup rodlog", async () => {
	const baseUrl = getInputs({ "release-base": { default: "https://rodkisten.github.io/rodlog/releases" } })["release-base"].replace(/\/$/, "");
	const runnerTemp = process.env.RUNNER_TEMP || tmpdir();
	const targetPath = join(runnerTemp, "rodlog");
	let binaryName = "unknown";
	let attemptedUrl = baseUrl;
	let usedFallback = false;
	let fallbackReason = "";
	try {
		binaryName = resolvePlatformBinary();
		attemptedUrl = `${baseUrl}/${binaryName}`;
		logger.banner("Setup rodlog", `${binaryName} · SHA-256 verified`);
		await logger.step("Download & verify rodlog binary", async () => {
			logger.item("Mirror", baseUrl);
			logger.item("Artifact", binaryName, true);
			const checksumsUrl = `${baseUrl}/checksums.txt`;
			attemptedUrl = checksumsUrl;
			const expectedLine = (await logger.spin("Fetching checksums.txt", async () => {
				const res = await fetch(checksumsUrl);
				if (!res.ok) throw new Error(`Failed to fetch checksums.txt (${res.status})`);
				return res.text();
			})).split(/\r?\n/).find((line) => new RegExp(`^[a-fA-F0-9]{64}\\s+${binaryName}$`).test(line.trim()));
			if (!expectedLine) throw new Error(`Checksum entry not found for ${binaryName}`);
			const expectedHash = expectedLine.trim().split(/\s+/)[0].toLowerCase();
			const binaryUrl = `${baseUrl}/${binaryName}`;
			attemptedUrl = binaryUrl;
			const binaryBuffer = await logger.spin(`Downloading ${binaryName}`, async () => {
				const res = await fetch(binaryUrl);
				if (!res.ok) throw new Error(`Failed to download ${binaryName} (${res.status})`);
				return Buffer.from(await res.arrayBuffer());
			});
			const actualHash = createHash("sha256").update(binaryBuffer).digest("hex").toLowerCase();
			if (actualHash !== expectedHash) throw new Error(`SHA-256 checksum mismatch for ${binaryName}: expected ${expectedHash}, got ${actualHash}`);
			mkdirSync(runnerTemp, { recursive: true });
			const stageFile = join(runnerTemp, `.rodlog-${Date.now()}`);
			try {
				writeFileSync(stageFile, binaryBuffer);
				chmodSync(stageFile, 493);
				writeFileSync(targetPath, readFileSync(stageFile));
				chmodSync(targetPath, 493);
			} finally {
				rmSync(stageFile, { force: true });
			}
			import_core.addPath(runnerTemp);
			const versionRes = await cmd(`"${targetPath}" version`).nothrow();
			logger.item("Verified SHA-256", `${expectedHash.slice(0, 12)}...`);
			logger.item("Installed binary", targetPath);
			logger.item("Version", versionRes.stdout || "unknown", true);
		});
	} catch (err) {
		usedFallback = true;
		fallbackReason = err instanceof Error ? err.message : String(err);
		printFallbackWarningBox(attemptedUrl, fallbackReason);
		mkdirSync(runnerTemp, { recursive: true });
		installFallbackScript(targetPath);
		import_core.addPath(runnerTemp);
		logger.item("Fallback wrapper", targetPath, true);
	}
	setOutputs({
		binary: targetPath,
		fallback: String(usedFallback)
	});
	if (usedFallback) {
		await summary.publish("⚠️ rodlog ready (fallback mode)", [{ text: `Could not download \`rodlog\` from \`${attemptedUrl}\` (${fallbackReason}). Installed transparent passthrough wrapper instead.` }]);
		logger.success(`rodlog fallback wrapper installed at ${style.bold(targetPath)}`);
	} else {
		await summary.publish("🌈 rodlog ready", [{ text: `Verified \`${binaryName}\` against the published SHA-256 checksum.` }]);
		logger.success(`rodlog installed at ${style.bold(targetPath)}`);
	}
	logger.divider("", "═");
});
export {};
