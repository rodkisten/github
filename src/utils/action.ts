import * as core from '@actions/core';
import { logger } from './logger.js';

/**
 * Wrapper padronizado para entrypoints de GitHub Actions.
 * Garante tratamento consistente de erros e logs padronizados sem boilerplate duplicado.
 */
export function runAction(name: string, fn: () => Promise<void>): void {
  fn().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(message, name);
    core.setFailed(message);
  });
}
