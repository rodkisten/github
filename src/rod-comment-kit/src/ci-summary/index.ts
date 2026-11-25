import { runAction } from '../utils/action.js';
import { getInputs } from '../utils/inputs.js';
import { logger, style } from '../utils/logger.js';
import { summary } from '../utils/summary.js';

function sanitizeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

runAction('CI Report', async () => {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    throw new Error('GITHUB_STEP_SUMMARY is not set');
  }

  const inputs = getInputs({
    title: { default: 'CI report' },
    status: { required: true },
    details: { default: '' },
  });

  const repository = process.env.GITHUB_REPOSITORY || 'unknown';
  const workflow = process.env.GITHUB_WORKFLOW || 'unknown';

  logger.banner(inputs.title, `${repository} · ${workflow}`);

  await logger.step('Write CI Job Summary', async () => {
    logger.item('Repository', repository);
    logger.item('Workflow', workflow);
    logger.item('Status', style.bold(inputs.status));
    logger.item('Has details', Boolean(inputs.details.trim()), true);

    summary.heading(inputs.title, 2).table([
      {
        Repository: sanitizeCell(repository),
        Workflow: sanitizeCell(workflow),
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
});
