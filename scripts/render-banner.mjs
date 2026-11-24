import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const catalog = JSON.parse(readFileSync(new URL('../config/projects.json', import.meta.url), 'utf8'));
const [project, event = 'Preview ready', output = 'banner.svg'] = process.argv.slice(2);
if (!Object.hasOwn(catalog, project)) throw new Error('Unknown project: ' + project);
const {emoji,color,name} = catalog[project];
const xml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
if (!/^#[0-9a-f]{6}$/i.test(color) || event.length > 60) throw new Error('Invalid banner configuration');
const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="180" viewBox="0 0 960 180" role="img" aria-label="${xml(name+' '+event)}">
<rect width="960" height="180" rx="18" fill="#18181b"/>
<rect x="0" y="0" width="12" height="180" rx="6" fill="${color}"/>
<circle cx="82" cy="90" r="42" fill="${color}" fill-opacity=".22"/>
<text x="82" y="104" text-anchor="middle" font-size="38" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${xml(emoji)}</text>
<g font-family="Geist,Arial,sans-serif" fill="#fafafa"><text x="146" y="58" font-size="18" font-weight="600">${xml(name)}</text><text x="146" y="111" font-size="42" font-weight="700">${xml(event)}</text><text x="146" y="145" font-size="15" fill="#a1a1aa">@rodkisten</text></g>
</svg>`;
mkdirSync(dirname(resolve(output)),{recursive:true});
writeFileSync(output,markup+'\n');
