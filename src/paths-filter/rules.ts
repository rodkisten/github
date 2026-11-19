import picomatch from 'picomatch';
import YAML from 'yaml';

type FilterRule = string[] | { paths: string[]; dependsOn?: string[]; 'depends-on'?: string[] };
type Filters = Record<string, FilterRule>;
type Config = { version: number; defaults?: { filters?: Filters }; repositories?: Record<string, { filters?: Filters }> };

function normalize(rule: FilterRule, name: string): { paths: string[]; dependencies: string[] } {
  const paths = Array.isArray(rule) ? rule : rule?.paths;
  const dependencies = Array.isArray(rule) ? [] : (rule?.dependsOn ?? rule?.['depends-on'] ?? []);
  if (!Array.isArray(paths) || !paths.length || paths.some(path => typeof path !== 'string' || !path.trim())) {
    throw new Error('Invalid paths for filter ' + name);
  }
  if (!Array.isArray(dependencies) || dependencies.some(dep => typeof dep !== 'string' || !dep.trim())) {
    throw new Error('Invalid dependencies for filter ' + name);
  }
  return { paths, dependencies };
}

export function selectFilters(source: string, repository: string): Filters {
  const config = YAML.parse(source) as Config;
  if (config?.version !== 1) throw new Error('Unsupported config version');
  const specific = config.repositories?.[repository];
  if (!specific) throw new Error('No path rules configured for ' + repository);
  const filters = { ...config.defaults?.filters, ...specific.filters };
  if (!Object.keys(filters).length) throw new Error('No filters configured');
  for (const [name, rule] of Object.entries(filters)) normalize(rule, name);
  for (const [name, rule] of Object.entries(filters)) {
    for (const dependency of normalize(rule, name).dependencies) {
      if (!(dependency in filters)) throw new Error('Unknown dependency ' + dependency + ' declared by filter ' + name);
    }
  }
  return filters;
}

export function matchChangedFiles(files: string[], filters: Filters): string[] {
  const matched = new Set(Object.entries(filters).filter(([, rule]) => {
    const paths = normalize(rule, 'unknown').paths;
    return files.some(file => paths.some(pattern => {
      const excluded = pattern.startsWith('!');
      const glob = excluded ? pattern.slice(1) : pattern;
      return !excluded && picomatch.isMatch(file, glob, { dot: true }) &&
        !paths.some(item => item.startsWith('!') && picomatch.isMatch(file, item.slice(1), { dot: true }));
    }));
  }).map(([name]) => name));
  const visited = new Set<string>();
  const visit = (name: string, stack: string[] = []): void => {
    if (stack.includes(name)) throw new Error('Circular filter dependency detected: ' + [...stack, name].join(' -> '));
    if (visited.has(name)) return;
    const rule = filters[name];
    if (!rule) throw new Error('Unknown filter ' + name);
    const nextStack = [...stack, name];
    for (const dependency of normalize(rule, name).dependencies) {
      matched.add(dependency);
      visit(dependency, nextStack);
    }
    visited.add(name);
  };
  for (const name of [...matched]) visit(name);
  return [...matched];
}
