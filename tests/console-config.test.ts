import { describe, expect, it } from 'vitest';
import { eventDedupeKey, resolveConfig, shouldNotify } from '../src/console/config.js';

const defaults = `
version: 1
console: { enabled: true, renderer: rodlog }
hooks:
  shell: { enabled: false, notifyOn: [failure] }
  github: { enabled: true, notifyOn: [step.failure, job.completed] }
notify:
  enabled: false
  provider: relay
  debounceSeconds: 5
  ignore: [cancelled, skipped]
  groupBy: [repository, run_id]
release: { mode: hybrid, initialVersion: 1.0.0 }
`;

describe('central console configuration', () => {
  it('merges repository overrides without dropping nested defaults', () => {
    const config = resolveConfig(defaults, 'notify: { enabled: true, debounceSeconds: 10 }');
    expect(config.notify.provider).toBe('relay');
    expect(config.notify.debounceSeconds).toBe(10);
    expect(shouldNotify(config, { type: 'step.failure', conclusion: 'failure' })).toBe(true);
    expect(shouldNotify(config, { type: 'job.completed', conclusion: 'skipped' })).toBe(false);
  });
  it('rejects unknown configuration keys', () => {
    expect(() => resolveConfig(defaults, 'notify: { typo: true }')).toThrow(/Unknown config key/);
  });
  it('rejects invalid versions and values', () => {
    expect(() => resolveConfig(defaults, 'version: 2')).toThrow(/version/);
    expect(() => resolveConfig(defaults, 'notify: { debounceSeconds: -1 }')).toThrow(/debounce/);
  });
  it('creates stable event deduplication keys', () => {
    expect(eventDedupeKey({ repository: 'rodkisten/github', runId: 4, jobId: 5, step: 'build', type: 'step.failure' }))
      .toBe('rodkisten/github:4:5:build:step.failure');
  });
});
