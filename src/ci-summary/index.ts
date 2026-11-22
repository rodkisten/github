import * as core from '@actions/core';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';

interface ReportInputs {
  title: string;
  status: string;
  details: string;
  repository: string;
  workflow: string;
}

function getInputs(): ReportInputs {
  return {
    title: core.getInput('title') || 'CI report',
    status: core.getInput('status', { required: true }),
    details: core.getInput('details'),
    repository: process.env.GITHUB_REPOSITORY || 'unknown',
    workflow: process.env.GITHUB_WORKFLOW || 'unknown',
  };
}

function sanitizeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

async function main(): Promise<void> {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    throw new Error('GITHUB_STEP_SUMMARY is not set');
  }

  const inputs = getInputs();

  logger.banner(inputs.title, `${inputs.repository} · ${inputs.workflow}`);

  await logger.step('Write CI Job Summary', async () => {
    logger.item('Repository', inputs.repository);
    logger.item('Workflow', inputs.workflow);
    logger.item('Status', style.bold(inputs.status));
    logger.item('Has details', Boolean(inputs.details.trim()), true);

    summary.heading(inputs.title, 2).table([
      {
        Repository: sanitizeCell(inputs.repository),
        Workflow: sanitizeCell(inputs.workflow),
        Status: sanitizeCell(inputs.status),
      },
    ]);

    if (inputs.details.trim()) {
      summary.text(inputs.details);
    }

    await summary.write();
  });

  logger.success('CI report published to Job Summary');
  logger.divider('', '═');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(message, 'CI Report');
  core.setFailed(message);
});
