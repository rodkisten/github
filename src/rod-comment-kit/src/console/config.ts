import { parse } from 'yaml';

export type RodConfig = {
  version: 1;
  console: { enabled: boolean; renderer: 'rodlog' | 'plain' };
  hooks: {
    shell: { enabled: boolean; notifyOn: string[] };
    github: { enabled: boolean; notifyOn: string[] };
  };
  notify: {
    enabled: boolean;
    provider: 'relay' | 'none';
    debounceSeconds: number;
    ignore: string[];
    groupBy: string[];
  };
  release: { mode: 'hybrid' | 'semantic' | 'manual'; initialVersion: string };
};

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function mergeConfig<T>(base: T, override: unknown): T {
  if (!record(base) || !record(override)) return (override === undefined ? base : override) as T;
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (!(key in base)) throw new Error('Unknown config key: ' + key);
    result[key] = mergeConfig(base[key], value);
  }
  return result as T;
}

export function resolveConfig(defaultYaml: string, repositoryYaml?: string): RodConfig {
  const defaults: unknown = parse(defaultYaml, { uniqueKeys: true });
  const overrides: unknown = repositoryYaml ? parse(repositoryYaml, { uniqueKeys: true }) : undefined;
  if (!record(defaults)) throw new Error('Default configuration must be a mapping');
  if (overrides !== undefined && !record(overrides)) throw new Error('Override must be a mapping');
  const config = mergeConfig(defaults, overrides) as RodConfig;
  if (config.version !== 1) throw new Error('Unsupported configuration version');
  if (!['rodlog', 'plain'].includes(config.console.renderer)) throw new Error('Invalid console renderer');
  if (!['relay', 'none'].includes(config.notify.provider)) throw new Error('Invalid notification provider');
  if (!['hybrid', 'semantic', 'manual'].includes(config.release.mode)) throw new Error('Invalid release mode');
  if (!Number.isInteger(config.notify.debounceSeconds) || config.notify.debounceSeconds < 0 || config.notify.debounceSeconds > 3600) throw new Error('Invalid debounceSeconds');
  if (!/^\d+\.\d+\.\d+$/.test(config.release.initialVersion)) throw new Error('Invalid initialVersion');
  for (const events of [config.hooks.shell.notifyOn, config.hooks.github.notifyOn, config.notify.ignore, config.notify.groupBy]) {
    if (!Array.isArray(events) || !events.every(x => typeof x === 'string')) throw new Error('Expected string array');
  }
  for (const flag of [config.console.enabled, config.hooks.shell.enabled, config.hooks.github.enabled, config.notify.enabled]) {
    if (typeof flag !== 'boolean') throw new Error('Expected boolean flag');
  }
  return config;
}

export function eventDedupeKey(event: {
  repository: string; runId: number; jobId?: number; step?: string; type: string;
}): string {
  return [event.repository, event.runId, event.jobId ?? 'workflow', event.step ?? '-', event.type].join(':');
}

export function shouldNotify(config: RodConfig, event: { type: string; conclusion?: string }): boolean {
  if (!config.notify.enabled) return false;
  if (event.conclusion && config.notify.ignore.includes(event.conclusion)) return false;
  return config.hooks.github.enabled && config.hooks.github.notifyOn.includes(event.type);
}
