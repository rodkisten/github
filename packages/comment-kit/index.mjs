import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync(new URL('./assets/manifest.json',import.meta.url),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','&#124;').replaceAll('\n',' ');
const url=s=>{const u=new URL(s);if(u.protocol!=='https:')throw Error('HTTPS required');return u.href.replaceAll('(','%28').replaceAll(')','%29');};
export class Comment {
 constructor({baseUrl,marker='rod-comment-kit'}={}){this.base=url(baseUrl).replace(/\/$/,'');if(!/^[\w-]+$/.test(marker))throw Error('Invalid marker');this.parts=[`<!-- ${marker} -->`];}
 asset(path){return `${this.base}/${path}`;}
 icon(key){if(!manifest[key])throw Error('Unknown icon '+key);return `<img src="${this.asset(manifest[key].replace('.svg','.png'))}" width="20" height="20" alt="${esc(key)}">`;}
 banner(key){if(!['preview','architecture','security','diff','failure','ploocky','build','tests'].includes(key))throw Error('Unknown banner');this.parts.push(`![${key}](${this.asset('assets/banners/'+key+'.png')})`);return this;}
 info(text){this.parts.push('> [!NOTE]\n> **INFO:** '+esc(text));return this;}
 metrics(rows){this.parts.push(['| Metric | Base | HEAD | Δ |','| --- | ---: | ---: | ---: |',...rows.map(r=>`| ${esc(r.name)} | ${esc(r.base)} | ${esc(r.head)} | ${esc(r.delta)} |`)].join('\n'));return this;}
 details(title,body){this.parts.push(`<details>\n<summary>${esc(title)}</summary>\n\n${body}\n\n</details>`);return this;}
 mermaid(graph,{collapsed=true}={}){if(graph.includes('```'))throw Error('Invalid Mermaid fence');const body='```mermaid\n'+graph+'\n```';return collapsed?this.details('Dependency graph',body):(this.parts.push(body),this);}
 link(label,href){this.parts.push(`[${esc(label).replaceAll('[','&#91;').replaceAll(']','&#93;')}](${url(href)})`);return this;}
 footer(){this.parts.push('<sub>Rod Actions · Comment Kit</sub>');return this;}
 render(){const body=this.parts.join('\n\n');if(body.length>65000)throw Error('GitHub body limit');return body;}
}
