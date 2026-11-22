export interface SkipCiDecision {
  skip: boolean;
  reason: 'normal' | 'commit-marker' | 'bot-actor';
}

export function evaluateSkipCi(
  commitMessage: string,
  actor: string,
  skipBots: boolean
): SkipCiDecision {
  if (/\[(skip[[:space:]\s]ci|ci[[:space:]\s]skip)\]/i.test(commitMessage)) {
    return { skip: true, reason: 'commit-marker' };
  }

  if (skipBots && actor.endsWith('[bot]')) {
    return { skip: true, reason: 'bot-actor' };
  }

  return { skip: false, reason: 'normal' };
}
