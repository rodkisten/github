import { describe, expect, it } from 'vitest';
import { evaluateSkipCi } from '../src/skip-ci/rules.js';

describe('skip-ci decision rules', () => {
  it('skips when commit message contains [skip ci] or [ci skip]', () => {
    expect(evaluateSkipCi('docs: update readme [skip ci]', 'rodkisten', false)).toEqual({
      skip: true,
      reason: 'commit-marker',
    });
    expect(evaluateSkipCi('chore: release [ci skip]', 'rodkisten', false)).toEqual({
      skip: true,
      reason: 'commit-marker',
    });
  });

  it.each(['[SKIP CI]', '[ci  skip]', '[skip\tci]'])('recognizes marker %s', (marker) => {
    expect(evaluateSkipCi(marker, 'rodkisten', false).skip).toBe(true);
  });

  it.each(['skip ci', '[skip-ci]', '[skip ci later]', 'normal commit'])('does not skip %s', (message) => {
    expect(evaluateSkipCi(message, 'rodkisten', false).skip).toBe(false);
  });

  it('skips bot actors only when skipBots is true', () => {
    expect(evaluateSkipCi('chore(deps): bump vitest', 'dependabot[bot]', false)).toEqual({
      skip: false,
      reason: 'normal',
    });
    expect(evaluateSkipCi('chore(deps): bump vitest', 'dependabot[bot]', true)).toEqual({
      skip: true,
      reason: 'bot-actor',
    });
  });
});
