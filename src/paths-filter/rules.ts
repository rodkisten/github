import picomatch from 'picomatch';
import YAML from 'yaml';

type Filters = Record<string, string[]>;
type Config = { version: number; defaults?: { filters?: Filters }; repositories?: Record<string, { filters?: Filters }> };

export function selectFilters(source: string, repository: string): Filters {
  const config = YAML.parse(source) as Config;
  if (config?.version !== 1) throw new Error('Unsupported config version');
  const specific = config.repositories?.[repository];
  if (!specific) throw new Error(`No path rules configured for ${repository}`);
  const filters = { ...config.defaults?.filters, ...specific.filters };
  if (!Object.keys(filters).length) throw new Error('No filters configured');
  for (const [name, patterns] of Object.entries(filters)) {
    if (!Array.isArray(patterns) || !patterns.length || patterns.some(p => typeof p !== 'string' || !p.trim())) {
      throw new Error(`Invalid patterns for filter ${name}`);
    }
  }
  return filters;
}

export function matchChangedFiles(files: string[], filters: Filters): string[] {
  return Object.entries(filters).filter(([, patterns]) =>
    files.some(file => patterns.some(pattern => {
      const exclude = pattern.startsWith('!');
      const glob = exclude ? pattern.slice(1) : pattern;
      return !exclude && picomatch.isMatch(file, glob, { dot: true }) &&
        !patterns.some(p => p.startsWith('!') && picomatch.isMatch(file, p.slice(1), { dot: true }));
    }))
  ).map(([name]) => name);
}
