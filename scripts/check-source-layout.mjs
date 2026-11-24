import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const duplicates = walk('src').filter(path => path.endsWith('.js') && existsSync(path.slice(0, -3) + '.ts'));
if (duplicates.length) throw new Error('JavaScript shadows TypeScript sources:\n' + duplicates.join('\n'));
console.log('Source layout verified');
