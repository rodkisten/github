import{chmodSync as e,mkdirSync as t,readFileSync as n,rmSync as r,writeFileSync as i}from"node:fs";import{createHash as a}from"node:crypto";import{tmpdir as o}from"node:os";import{join as s}from"node:path";import{p as c,t as l}from"./core-BLRCRCrs.js";import{a as u,i as d,n as f,r as p,t as m}from"./inputs-DGg0rlAX.js";import{n as h}from"./cmd-CvwSWl--.js";import{t as g}from"./summary-CPZgta1q.js";function _(){let e=process.platform,t=process.arch,n={linux:`linux`,darwin:`darwin`},r={x64:`amd64`,arm64:`arm64`},i=n[e],a=r[t];if(!i)throw Error(`Unsupported OS for rodlog: ${e}`);if(!a)throw Error(`Unsupported architecture for rodlog: ${t}`);return`rodlog_${i}_${a}`}function v(e,t){let n=`═`.repeat(76),r=e=>`║ ${e.slice(0,74).padEnd(74)} ║`,i=[``,`╔${n}╗`,r(`⚠️  AVISO: USANDO FALLBACK TRANSPARENTE DO RODLOG`),`╠${n}╣`,r(`Não foi possível baixar ou validar o binário oficial do rodlog.`),r(`URL tentada: ${e}`),r(`Motivo: ${t}`),r(``),r(`Um wrapper transparente foi criado: tudo após "--" será executado`),r(`diretamente sem interromper o pipeline.`),`╚${n}╝`,``].join(`
`);console.warn(u.yellow?u.yellow(u.bold(i)):i),c(`[rodlog fallback] Falha ao baixar de ${e} (${t}). Usando wrapper transparente.`)}function y(t){i(t,`#!/usr/bin/env node
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
`,`utf8`),e(t,493)}p(`Setup rodlog`,async()=>{let c=m({"release-base":{default:`https://rodkisten.github.io/rodlog/releases`}})[`release-base`].replace(/\/$/,``),p=process.env.RUNNER_TEMP||o(),b=s(p,`rodlog`),x=`unknown`,S=c,C=!1,w=``;try{x=_(),S=`${c}/${x}`,d.banner(`Setup rodlog`,`${x} · SHA-256 verified`),await d.step(`Download & verify rodlog binary`,async()=>{d.item(`Mirror`,c),d.item(`Artifact`,x,!0);let o=`${c}/checksums.txt`;S=o;let u=(await d.spin(`Fetching checksums.txt`,async()=>{let e=await fetch(o);if(!e.ok)throw Error(`Failed to fetch checksums.txt (${e.status})`);return e.text()})).split(/\r?\n/).find(e=>RegExp(`^[a-fA-F0-9]{64}\\s+${x}$`).test(e.trim()));if(!u)throw Error(`Checksum entry not found for ${x}`);let f=u.trim().split(/\s+/)[0].toLowerCase(),m=`${c}/${x}`;S=m;let g=await d.spin(`Downloading ${x}`,async()=>{let e=await fetch(m);if(!e.ok)throw Error(`Failed to download ${x} (${e.status})`);return Buffer.from(await e.arrayBuffer())}),_=a(`sha256`).update(g).digest(`hex`).toLowerCase();if(_!==f)throw Error(`SHA-256 checksum mismatch for ${x}: expected ${f}, got ${_}`);t(p,{recursive:!0});let v=s(p,`.rodlog-${Date.now()}`);try{i(v,g),e(v,493),i(b,n(v)),e(b,493)}finally{r(v,{force:!0})}l(p);let y=await h(`"${b}" version`).nothrow();d.item(`Verified SHA-256`,`${f.slice(0,12)}...`),d.item(`Installed binary`,b),d.item(`Version`,y.stdout||`unknown`,!0)})}catch(e){C=!0,w=e instanceof Error?e.message:String(e),v(S,w),t(p,{recursive:!0}),y(b),l(p),d.item(`Fallback wrapper`,b,!0)}f({binary:b,fallback:String(C)}),C?(await g.publish(`⚠️ rodlog ready (fallback mode)`,[{text:`Could not download \`rodlog\` from \`${S}\` (${w}). Installed transparent passthrough wrapper instead.`}]),d.success(`rodlog fallback wrapper installed at ${u.bold(b)}`)):(await g.publish(`🌈 rodlog ready`,[{text:`Verified \`${x}\` against the published SHA-256 checksum.`}]),d.success(`rodlog installed at ${u.bold(b)}`)),d.divider(``,`═`)});export{};
//# sourceMappingURL=setup-rodlog.js.map