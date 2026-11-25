# Rod Actions · Comment Kit

Original vector icons, compact banners, orbital illustrations and badges. SVG sources and PNG fallbacks. No npm dependencies. Node 20+.

## Publish
Host the `assets/` directory on GitHub Pages or another HTTPS static host. Pass the site root as `baseUrl`. PNG is the default for GitHub compatibility. Assets are dark-backed for legibility on both GitHub themes.

```js
import { Comment } from './packages/comment-kit/index.mjs';
const body = new Comment({baseUrl:'https://YOUR-HOST.example'})
 .banner('architecture').info('Compare main with PR HEAD.')
 .metrics([{name:'Modules',base:206,head:206,delta:0}])
 .details('Changes','No new modules.')
 .mermaid('flowchart LR\n A --> B')
 .link('Artifacts','https://github.com/rodkisten/userscripts-cf/actions')
 .footer().render();
console.log(body);
```

Use the marker to update an existing bot comment or manage a delimited PR description section. The library renders Markdown only; it does not authenticate or publish to GitHub. `details` accepts trusted Markdown. No remote assets are published by this archive.
