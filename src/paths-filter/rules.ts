import picomatch from 'picomatch';
import YAML from 'yaml';

export interface FilterCommands {
  test?: string | false;
  build?: string | false;
  lint?: string | false;
}
export interface FilterOptions {
  paths: string[];
  dependsOn?: string[];
  'depends-on'?: string[];
  commands?: FilterCommands;
  'working-directory'?: string;
  workingDirectory?: string;
}
type FilterRule = string[] | FilterOptions;
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

function normalize(rule: FilterRule, name: string, repository = 'unknown'): { paths: string[]; dependencies: string[]; commands: FilterCommands; workingDirectory?: string } {
  const paths = patternsFor(name, rule, repository);
  const dependencies = Array.isArray(rule) ? [] : (rule?.dependsOn ?? rule?.['depends-on'] ?? []);
  if (!Array.isArray(dependencies) || dependencies.some(dep => typeof dep !== 'string' || !dep.trim())) {
    throw new Error('Invalid dependencies for filter ' + name);
  }
  const commands = Array.isArray(rule) ? {} : (rule.commands ?? {});
  for (const [task, command] of Object.entries(commands)) {
    if (!['test', 'build', 'lint'].includes(task) || (command !== false && (typeof command !== 'string' || !command.trim()))) {
      throw new Error('Invalid ' + task + ' command for filter ' + name);
    }
  }
  const workingDirectory = Array.isArray(rule) ? undefined : (rule['working-directory'] ?? rule.workingDirectory);
  if (workingDirectory !== undefined && (typeof workingDirectory !== 'string' || !workingDirectory.trim())) {
    throw new Error('Invalid working-directory for filter ' + name);
  }
  return { paths, dependencies, commands, workingDirectory };
}

export function selectFilters(source: string, repository: string): Filters {
  const config = YAML.parse(source) as Config;
  if (config?.version !== 1) throw new Error('Unsupported config version');
  const specific = config.repositories?.[repository];
  if (!specific) throw new Error('No path rules configured for ' + repository);
  const filters = { ...config.defaults?.filters, ...specific.filters };
  if (!Object.keys(filters).length) throw new Error('No filters configured');
  for (const [name, rule] of Object.entries(filters)) normalize(rule, name, repository);
  for (const [name, rule] of Object.entries(filters)) {
    for (const dependency of normalize(rule, name, repository).dependencies) {
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

export function resolveMatchedFilters(files: string[], filters: Filters, fullRun = false): string[] {
  return fullRun ? Object.keys(filters) : matchChangedFiles(files, filters);
}

export interface FilterMatrixDefaults {
  workingDirectory: string;
  testCommand: string;
  buildCommand: string;
  lintCommand: string;
  runTests: boolean;
  runBuild: boolean;
  runLint: boolean;
}
export interface FilterMatrixEntry {
  filter: string;
  'working-directory': string;
  'test-command': string;
  'build-command': string;
  'lint-command': string;
  'run-tests': boolean;
  'run-build': boolean;
  'run-lint': boolean;
}
export function buildFilterMatrix(changes: string[], filters: Filters, defaults: FilterMatrixDefaults): FilterMatrixEntry[] {
  return changes.map(name => {
    const rule = filters[name];
    if (!rule) throw new Error('Unknown filter ' + name);
    const normalized = normalize(rule, name);
    const commands = normalized.commands;
    return {
      filter: name,
      'working-directory': normalized.workingDirectory ?? defaults.workingDirectory,
      'test-command': typeof commands.test === 'string' ? commands.test : defaults.testCommand,
      'build-command': typeof commands.build === 'string' ? commands.build : defaults.buildCommand,
      'lint-command': typeof commands.lint === 'string' ? commands.lint : defaults.lintCommand,
      'run-tests': commands.test === false ? false : typeof commands.test === 'string' ? true : defaults.runTests,
      'run-build': commands.build === false ? false : typeof commands.build === 'string' ? true : defaults.runBuild,
      'run-lint': commands.lint === false ? false : typeof commands.lint === 'string' ? true : defaults.runLint,
    };
  });
}
