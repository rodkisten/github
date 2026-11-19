import picomatch from 'picomatch';
import YAML from 'yaml';

export type FilterRule = string[] | { paths: string[]; commands?: { test?: string | false; build?: string | false; lint?: string | false }; 'depends-on'?: string[]; dependsOn?: string[]; 'working-directory'?: string; workingDirectory?: string };
type Filters = Record<string, FilterRule>;
type Config = { version: number; defaults?: { filters?: Filters }; repositories?: Record<string, { filters?: Filters }> };
const configUrl = (repository: string) => `https://github.com/rodkisten/github/blob/main/config/paths.yml#L1`;
function patternsFor(name: string, rule: FilterRule, repository: string): string[] {
  const paths = Array.isArray(rule) ? rule : rule?.paths;
  if (!Array.isArray(paths) || !paths.length || paths.some(p => typeof p !== 'string' || !p.trim())) {
    throw new Error(`Invalid paths for filter "${name}" in repository "${repository}". Expected a nonempty glob array or { paths: [...] }. Configure the repository entry at ${configUrl(repository)} (repositories → ${repository} → filters → ${name}).`);
  }
  return paths;
}

export function selectFilters(source: string, repository: string): Filters {
  const config = YAML.parse(source) as Config;
  if (config?.version !== 1) throw new Error('Unsupported config version');
  const specific = config.repositories?.[repository];
  if (!specific) throw new Error(`No path rules configured for ${repository}`);
  const filters = { ...config.defaults?.filters, ...specific.filters };
  if (!Object.keys(filters).length) throw new Error('No filters configured');
  for (const [name, rule] of Object.entries(filters)) patternsFor(name, rule, repository);
  return filters;
}

export function matchChangedFiles(files: string[], filters: Filters): string[] {
  return Object.entries(filters).filter(([, patterns]) =>
    files.some(file => (Array.isArray(patterns) ? patterns : patterns.paths).some(pattern => {
      const exclude = pattern.startsWith('!');
      const glob = exclude ? pattern.slice(1) : pattern;
      return !exclude && picomatch.isMatch(file, glob, { dot: true }) &&
        !(Array.isArray(patterns) ? patterns : patterns.paths).some(p => p.startsWith('!') && picomatch.isMatch(file, p.slice(1), { dot: true }));
    }))
  ).map(([name]) => name);
}
