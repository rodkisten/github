import * as core from '@actions/core';
import { logger } from './logger.js';
import * as cmd from './cmd.js';
import * as git from './git.js';
import * as octoKit from '@actions/github';

export interface ActionContext {
  logger: typeof logger;
  utils: typeof utils; 
  git: typeof git;     
  octoKit: typeof octoKit;
}

/**
 * Wrapper padronizado para entrypoints de GitHub Actions.
 * Garante tratamento consistente de erros e logs padronizados sem boilerplate duplicado.
 */
export async function runAction(
  name: string,
  fn: (ctx: ActionContext) => Promise<void>
): Promise<void> {
  try {
    await fn({ logger, utils, git, octoKit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message, name);
    core.setFailed(message);
  }
}
