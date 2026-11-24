import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const projects = JSON.parse(readFileSync(new URL('config/projects.json',root),'utf8'));
const events = {
  "preview-ready": "Preview ready",
  "issue-updated": "Issue updated",
  "build-failed": "Build failed",
  "release-published": "Release published",
  "tests-passed": "Tests passed",
  "deployment-ready": "Deployment ready"
};
for (const project of Object.keys(projects)) {
  for (const [slug,event] of Object.entries(events)) {
    const output = fileURLToPath(new URL('assets/banners/'+project+'/'+slug+'.svg',root));
    const result = spawnSync(process.execPath,[fileURLToPath(new URL('scripts/render-banner.mjs',root)),project,event,output],{stdio:'inherit'});
    if (result.status !== 0) throw new Error('Banner generation failed: '+project+'/'+slug);
  }
}
