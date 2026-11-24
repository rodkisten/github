import { detect } from './detect-workspace.mjs';
import { appendFileSync } from 'node:fs';
if (Boolean(process.env.SCRIPT) === Boolean(process.env.FILE)) throw new Error('Provide exactly one of script or file');
const result = detect(process.env.WORKSPACE, process.env.MANAGER);
for (const [key,value] of Object.entries({manager:result.manager,version:process.env.VERSION || result.version,lockfile:result.lockfile})) {
  if (/[\r\n]/.test(value)) throw new Error('Invalid output: '+key);
  appendFileSync(process.env.GITHUB_OUTPUT, key+'='+value+'\n');
}
