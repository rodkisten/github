import picomatch from 'picomatch';
import YAML from 'yaml';

type FilterRule = string[] | { paths: string[]; dependsOn?: string[]; 'depends-on'?: string[] };
type Filters = Record<string, FilterRule>;
type Config = { version: number; defaults?: { filters?: Filters }; repositories?: Record<string, { filters?: Filters }> };

function normalize(rule: FilterRule, name: string): { paths: string[]; dependencies: string[] } {
  const paths = Array.isArray(rule) ? rule : rule?.paths;
  const dependencies = Array.isArray(rule) ? [] : (rule?.dependsOn ?? rule?.['depends-on'] ?? []);
  if (!Array.isArray(paths) || !paths.length || paths.some(p => typeof p !== 'string' || !p.trim())) {
    throw new Error(\`Invalid paths for filter \${name}\`);
  }
  if (!Array.isArray(dependencies) || dependencies.some(dep => typeof dep !== 'string' || !dep.trim())) {
    throw new Error(\`Invalid dependencies for filter \${name}\`);
  }
  return { paths, dependencies };
}

export function selectFilters(source: string, repository: string): Filters {
  const config = YAML.parse(source) as Config;
  if (config?.version !== 1) throw new Error('Unsupported config version');
  const specific = config.repositories?.[repository];
  if (!specific) throw new Error(\`No path rules configured for \${repository}\`);
  const filters = { ...config.defaults?.filters, ...specific.filters };
  if (!Object.keys(filters).length) throw new Error('No filters configured');
  for (const [name, rule] of Object.entries(filters)) normalize(rule, name);
  for (const [name, rule] of Object.entries(filters)) {
    for (const dependency of normalize(rule, name).dependencies) {
      if (!(dependency in filters)) throw new Error(\`Unknown dependency "\${dependency}" declared by filter "\${name}"\`);
    }
  }
  return filters;
}

export function matchChangedFiles(files: string[], filters: Filters): string[] {
  const matched = new Set(Object.entries(filters).filter(([, rule]) => {
    const { paths } = normalize(rule, 'unknown');
    return files.some(file => paths.some(pattern => {
      const exclude = pattern.startsWith('!');
      const glob = exclude ? pattern.slice(1) : pattern;
      return !exclude && picomatch.isMatch(file, glob, { dot: true }) &&
        !paths.some(p => p.startsWith('!') && picomatch.isMatch(file, p.slice(1), { dot: true }));
    }));
  }).map(([name]) => name));

  const visit = (name: string, visiting = new Set<string>()): void => {
    if (visiting.has(name)) throw new Error(\`Circular filter dependency detected at "\${name}"\`);
    const rule = filters[name];
    if (!rule || matched.has(name) && visiting.size === 0) {
      if (!rule) throw new Error(\`Unknown filter "\${name}"\`);
      return;
    }
    const next = new Set(visiting).add(name);
    for (const dependency of normalize(rule, name).dependencies) {
      if (next.has(dependency)) throw new Error(\`Circular filter dependency detected: \${[...next, dependency].join(' → ')}\`);
      if (!matched.has(dependency)) {
        matched.add(dependency);
        visit(dependency, next);
      }
    }
  };
  for (const name of [...matched]) visit(name);
  return [...matched];
}
