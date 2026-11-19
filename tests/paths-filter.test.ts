import { describe, expect, it } from 'vitest';
import { matchChangedFiles, selectFilters } from '../src/paths-filter/rules.js';

describe('central paths filters', () => {
  const config = 'version: 1\ndefaults:\n  filters:\n    docs: ["**/*.md"]\nrepositories:\n  demo:\n    filters:\n      app: ["src/**", "!src/generated/**"]\n';
  it('merges defaults and repository rules', () => expect(Object.keys(selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('matches changes and exclusions', () => expect(matchChangedFiles(['src/index.ts', 'src/generated/a.ts', 'README.md'], selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('excludes generated-only changes', () => expect(matchChangedFiles(['src/generated/a.ts'], selectFilters(config, 'demo'))).toEqual([]));
  it('rejects unknown repositories', () => expect(() => selectFilters(config, 'missing')).toThrow());
});
