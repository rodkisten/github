import { describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/console/config.js';
import { selectEvents } from '../src/console/events.js';

const defaults = `
version: 1
console: { enabled: true, renderer: rodlog }
hooks:
  shell: { enabled: false, notifyOn: [failure] }
  github: { enabled: true, notifyOn: [step.failure, job.completed] }
notify:
  enabled: true
  provider: relay
  debounceSeconds: 5
  ignore: [cancelled, skipped]
  groupBy: [repository, run_id]
release: { mode: hybrid, initialVersion: 1.0.0 }
`;
describe('event selection', () => {
  it('selects failed steps and completed jobs but skips successful steps', () => {
    const config = resolveConfig(defaults);
    const events = selectEvents(config, [{ id: 1, name: 'CI', conclusion: 'failure', html_url: 'https://github.com/example', steps: [{ name: 'Install', conclusion: 'success' }, { name: 'Build', conclusion: 'failure' }] }], 'a/b', 7);
    expect(events.map(event => event.type)).toEqual(['step.failure', 'job.completed']);
    expect(new Set(events.map(event => event.dedupeKey)).size).toBe(2);
  });
  it('does not select events when notifications are disabled', () => {
    const config = resolveConfig(defaults, 'notify: { enabled: false }');
    expect(selectEvents(config, [{ id: 1, name: 'CI', conclusion: 'failure', html_url: null }], 'a/b', 7)).toEqual([]);
  });
});
