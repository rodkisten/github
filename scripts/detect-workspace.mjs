import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function detect(directory, override = 'auto') {
  const has = name => existsSync(resolve(directory, name));
  const pkg = has('package.json') ? JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8')) : null;
  const declared = pkg?.packageManager;
  const match = declared ? /^(npm|pnpm|yarn|bun)@([^\s]+)$/.exec(declared) : null;
  if (declared && !match && override === 'auto') throw new Error('Unsupported packageManager: ' + declared);
  const locks = [['npm','package-lock.json'],['pnpm','pnpm-lock.yaml'],['yarn','yarn.lock'],['bun','bun.lock'],['bun','bun.lockb']].filter(([,file]) => has(file));
  const managers = [...new Set(locks.map(([manager]) => manager))];
  if (override === 'auto' && !match && managers.length > 1) throw new Error('Conflicting lockfiles: ' + managers.join(', '));
  const manager = override !== 'auto' ? override : match?.[1] ?? managers[0] ?? (pkg ? 'npm' : 'none');
  if (!['npm','pnpm','yarn','bun','none'].includes(manager)) throw new Error('Unsupported manager: ' + manager);
  return { manager, version: match?.[1] === manager ? match[2].split('+')[0] : '', lockfile: locks.find(([m]) => m === manager)?.[1] ?? '', node: pkg?.engines?.node ?? '' };
}
