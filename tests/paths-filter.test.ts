import { describe, expect, it } from 'vitest';
import { matchChangedFiles, selectFilters } from '../src/paths-filter/rules.js';

describe('central paths filters', () => {
  const config = 'version: 1\ndefaults:\n  filters:\n    docs: ["**/*.md"]\nrepositories:\n  demo:\n    filters:\n      app: ["src/**", "!src/generated/**"]\n';
  it('merges defaults and repository rules', () => expect(Object.keys(selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('matches changes and exclusions', () => expect(matchChangedFiles(['src/index.ts', 'src/generated/a.ts', 'README.md'], selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('excludes generated-only changes', () => expect(matchChangedFiles(['src/generated/a.ts'], selectFilters(config, 'demo'))).toEqual([]));
  it('accepts structured paths and excludes generated files', () => {
    const yaml = `version: 1
repositories:
  shell:
    filters:
      app:
        paths: ["src/**", "!src/generated/**"]
        commands:
          build: npm run build
`;
    const rules = selectFilters(yaml, 'shell');
    expect(matchChangedFiles(['src/app.ts'], rules)).toEqual(['app']);
    expect(matchChangedFiles(['src/generated/file.ts'], rules)).toEqual([]);
  });
  it('includes repository and config link in invalid-rule errors', () => {
    const yaml = `version: 1
repositories:
  shell:
    filters:
      app:
        paths: []
`;
    expect(() => selectFilters(yaml, 'shell')).toThrow('repositories → shell → filters → app');
    expect(() => selectFilters(yaml, 'shell')).toThrow('https://github.com/rodkisten/github/blob/main/config/paths.yml');
  });
  it('rejects unknown repositories', () => expect(() => selectFilters(config, 'missing')).toThrow());
});
