import{chmodSync as e,mkdirSync as t,readFileSync as n,rmSync as r,writeFileSync as i}from"node:fs";import{createHash as a}from"node:crypto";import{tmpdir as o}from"node:os";import{join as s}from"node:path";import{h as c,t as l,w as u}from"./action-CuxhN8kr.js";function d(){let e=process.platform,t=process.arch,n={linux:`linux`,darwin:`darwin`},r={x64:`amd64`,arm64:`arm64`},i=n[e],a=r[t];if(!i)throw Error(`Unsupported OS for rodlog: ${e}`);if(!a)throw Error(`Unsupported architecture for rodlog: ${t}`);return`rodlog_${i}_${a}`}function f(e,t){let n=`═`.repeat(76),r=e=>`║ ${e.slice(0,74).padEnd(74)} ║`,i=[``,`╔${n}╗`,r(`⚠️  AVISO: USANDO FALLBACK TRANSPARENTE DO RODLOG`),`╠${n}╣`,r(`Não foi possível baixar ou validar o binário oficial do rodlog.`),r(`URL tentada: ${e}`),r(`Motivo: ${t}`),r(``),r(`Um wrapper transparente foi criado: tudo após "--" será executado`),r(`diretamente sem interromper o pipeline.`),`╚${n}╝`,``].join(`
`);console.warn(c.yellow?c.yellow(c.bold(i)):i),u(`[rodlog fallback] Falha ao baixar de ${e} (${t}). Usando wrapper transparente.`)}function p(t){i(t,`#!/usr/bin/env node
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
`,`utf8`),e(t,493)}l(`Setup rodlog`,async({cmd:c,utils:l,logger:u,style:m,summary:h,core:g})=>{let{getInputs:_,setOutputs:v}=l,y=_({"release-base":{default:`https://rodkisten.github.io/rodlog/releases`}})[`release-base`].replace(/\/$/,``),b=process.env.RUNNER_TEMP||o(),x=s(b,`rodlog`),S=`unknown`,C=y,w=!1,T=``;try{S=d(),C=`${y}/${S}`,u.banner(`Setup rodlog`,`${S} · SHA-256 verified`),await u.step(`Download & verify rodlog binary`,async()=>{u.item(`Mirror`,y),u.item(`Artifact`,S,!0);let o=`${y}/checksums.txt`;C=o;let l=(await u.spin(`Fetching checksums.txt`,async()=>{let e=await fetch(o);if(!e.ok)throw Error(`Failed to fetch checksums.txt (${e.status})`);return e.text()})).split(/\r?\n/).find(e=>RegExp(`^[a-fA-F0-9]{64}\\s+${S}$`).test(e.trim()));if(!l)throw Error(`Checksum entry not found for ${S}`);let d=l.trim().split(/\s+/)[0].toLowerCase(),f=`${y}/${S}`;C=f;let p=await u.spin(`Downloading ${S}`,async()=>{let e=await fetch(f);if(!e.ok)throw Error(`Failed to download ${S} (${e.status})`);return Buffer.from(await e.arrayBuffer())}),m=a(`sha256`).update(p).digest(`hex`).toLowerCase();if(m!==d)throw Error(`SHA-256 checksum mismatch for ${S}: expected ${d}, got ${m}`);t(b,{recursive:!0});let h=s(b,`.rodlog-${Date.now()}`);try{i(h,p),e(h,493),i(x,n(h)),e(x,493)}finally{r(h,{force:!0})}g.addPath(b);let _=await c(`"${x}" version`).nothrow();u.item(`Verified SHA-256`,`${d.slice(0,12)}...`),u.item(`Installed binary`,x),u.item(`Version`,_.stdout||`unknown`,!0)})}catch(e){w=!0,T=e instanceof Error?e.message:String(e),f(C,T),t(b,{recursive:!0}),p(x),g.addPath(b),u.item(`Fallback wrapper`,x,!0)}v({binary:x,fallback:String(w)}),w?(await h.publish(`⚠️ rodlog ready (fallback mode)`,[{text:`Could not download \`rodlog\` from \`${C}\` (${T}). Installed transparent passthrough wrapper instead.`}]),u.success(`rodlog fallback wrapper installed at ${m.bold(x)}`)):(await h.publish(`🌈 rodlog ready`,[{text:`Verified \`${S}\` against the published SHA-256 checksum.`}]),u.success(`rodlog installed at ${m.bold(x)}`)),u.divider(``,`═`)});export{};
//# sourceMappingURL=setup-rodlog.js.map