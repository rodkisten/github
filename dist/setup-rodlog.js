import{chmodSync as e,mkdirSync as t,readFileSync as n,rmSync as r,writeFileSync as i}from"node:fs";import{createHash as a}from"node:crypto";import{tmpdir as o}from"node:os";import{join as s}from"node:path";import{s as c,y as l}from"./github-BxXLObkD.js";import{d as u,f as d,h as f,l as p,m,p as h,t as g}from"./action-Bi5piycR.js";function _(){let e=process.platform,t=process.arch,n={linux:`linux`,darwin:`darwin`},r={x64:`amd64`,arm64:`arm64`},i=n[e],a=r[t];if(!i)throw Error(`Unsupported OS for rodlog: ${e}`);if(!a)throw Error(`Unsupported architecture for rodlog: ${t}`);return`rodlog_${i}_${a}`}function v(e,t){let n=`═`.repeat(76),r=e=>`║ ${e.slice(0,74).padEnd(74)} ║`,i=[``,`╔${n}╗`,r(`⚠️  AVISO: USANDO FALLBACK TRANSPARENTE DO RODLOG`),`╠${n}╣`,r(`Não foi possível baixar ou validar o binário oficial do rodlog.`),r(`URL tentada: ${e}`),r(`Motivo: ${t}`),r(``),r(`Um wrapper transparente foi criado: tudo após "--" será executado`),r(`diretamente sem interromper o pipeline.`),`╚${n}╝`,``].join(`
`);console.warn(f.yellow?f.yellow(f.bold(i)):i),l(`[rodlog fallback] Falha ao baixar de ${e} (${t}). Usando wrapper transparente.`)}function y(t){i(t,`#!/usr/bin/env node
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
`,`utf8`),e(t,493)}g(`Setup rodlog`,async()=>{let l=d({"release-base":{default:`https://rodkisten.github.io/rodlog/releases`}})[`release-base`].replace(/\/$/,``),g=process.env.RUNNER_TEMP||o(),b=s(g,`rodlog`),x=`unknown`,S=l,C=!1,w=``;try{x=_(),S=`${l}/${x}`,m.banner(`Setup rodlog`,`${x} · SHA-256 verified`),await m.step(`Download & verify rodlog binary`,async()=>{m.item(`Mirror`,l),m.item(`Artifact`,x,!0);let o=`${l}/checksums.txt`;S=o;let u=(await m.spin(`Fetching checksums.txt`,async()=>{let e=await fetch(o);if(!e.ok)throw Error(`Failed to fetch checksums.txt (${e.status})`);return e.text()})).split(/\r?\n/).find(e=>RegExp(`^[a-fA-F0-9]{64}\\s+${x}$`).test(e.trim()));if(!u)throw Error(`Checksum entry not found for ${x}`);let d=u.trim().split(/\s+/)[0].toLowerCase(),f=`${l}/${x}`;S=f;let h=await m.spin(`Downloading ${x}`,async()=>{let e=await fetch(f);if(!e.ok)throw Error(`Failed to download ${x} (${e.status})`);return Buffer.from(await e.arrayBuffer())}),_=a(`sha256`).update(h).digest(`hex`).toLowerCase();if(_!==d)throw Error(`SHA-256 checksum mismatch for ${x}: expected ${d}, got ${_}`);t(g,{recursive:!0});let v=s(g,`.rodlog-${Date.now()}`);try{i(v,h),e(v,493),i(b,n(v)),e(b,493)}finally{r(v,{force:!0})}c(g);let y=await p(`"${b}" version`).nothrow();m.item(`Verified SHA-256`,`${d.slice(0,12)}...`),m.item(`Installed binary`,b),m.item(`Version`,y.stdout||`unknown`,!0)})}catch(e){C=!0,w=e instanceof Error?e.message:String(e),v(S,w),t(g,{recursive:!0}),y(b),c(g),m.item(`Fallback wrapper`,b,!0)}h({binary:b,fallback:String(C)}),C?(await u.publish(`⚠️ rodlog ready (fallback mode)`,[{text:`Could not download \`rodlog\` from \`${S}\` (${w}). Installed transparent passthrough wrapper instead.`}]),m.success(`rodlog fallback wrapper installed at ${f.bold(b)}`)):(await u.publish(`🌈 rodlog ready`,[{text:`Verified \`${x}\` against the published SHA-256 checksum.`}]),m.success(`rodlog installed at ${f.bold(b)}`)),m.divider(``,`═`)});export{};
//# sourceMappingURL=setup-rodlog.js.map