import { shouldNotify } from './config.js';
import type { RodConfig } from './config.js';
import { eventDedupeKey } from './config.js';

export function selectEvents(config: RodConfig, jobs: Array<{
  id: number; name: string; conclusion: string | null; html_url: string | null;
  steps?: Array<{ name: string; conclusion: string | null }> | null;
}>, repository: string, runId: number): Event[] {
  const events: Event[] = [];
  const add = (event: Omit<Event, 'dedupeKey'>): void => {
    if (!shouldNotify(config, event)) return;
    events.push({ ...event, dedupeKey: eventDedupeKey({ repository, runId, jobId: event.jobId, step: event.step, type: event.type }) });
  };
  for (const job of jobs) {
    const url = job.html_url ?? '';
    for (const step of job.steps ?? []) {
      if (!step.conclusion) continue;
      add({ type: step.conclusion === 'failure' ? 'step.failure' : 'step.success', conclusion: step.conclusion, repository, runId, jobId: job.id, step: step.name, url, timestamp: new Date().toISOString() });
    }
    if (job.conclusion) add({ type: 'job.completed', conclusion: job.conclusion, repository, runId, jobId: job.id, url, timestamp: new Date().toISOString() });
  }
  return events;
}
