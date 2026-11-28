import { runAction } from '../utils/action.js';
import { evaluateSkipCi } from './rules.js';

runAction('Skip CI Decision', async ({ utils, logger, style, summary, octoKit: github }) => {
  const { getInputs, setOutputs } = utils;
  const { owner, repo } = github.context.repo;
  logger.banner('Skip CI Decision', `${owner}/${repo}`);

  const inputs = await logger.step('Evaluate skip rules', () => {
    const parsed = getInputs({
      'commit-message': { required: true },
      actor: { default: github.context.actor || '' },
      'skip-bots': { type: 'boolean', default: false },
    });

    const decision = evaluateSkipCi(
      parsed['commit-message'],
      parsed.actor,
      parsed['skip-bots']
    );

    logger.item('Actor', parsed.actor || 'unknown');
    logger.item('Skip bots', parsed['skip-bots']);
    logger.item('Decision', decision.skip ? `SKIP (${decision.reason})` : 'RUN', true);

    return decision;
  });

  setOutputs({
    skip: inputs.skip,
    reason: inputs.reason,
  });

  await summary.publish('⏭️ Skip CI Decision', [
    {
      kv: {
        Skip: inputs.skip ? '✅ Yes' : '▶️ No',
        Reason: inputs.reason,
      },
    },
  ]);

  logger.success(
    inputs.skip
      ? `Skipping expensive CI jobs (${style.bold(inputs.reason)})`
      : 'Proceeding with standard CI execution'
  );
  logger.divider('', '═');
});
