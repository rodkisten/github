import { describe, expect, it } from 'vitest';
import { matchChangedFiles, selectFilters } from '../src/paths-filter/rules.js';

describe('central paths filters', () => {
  const config = 'version: 1\ndefaults:\n  filters:\n    docs: ["**/*.md"]\nrepositories:\n  demo:\n    filters:\n      app: ["src/**", "!src/generated/**"]\n';
  it('merges defaults and repository rules', () => expect(Object.keys(selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('matches changes and exclusions', () => expect(matchChangedFiles(['src/index.ts', 'src/generated/a.ts', 'README.md'], selectFilters(config, 'demo'))).toEqual(['docs', 'app']));
  it('excludes generated-only changes', () => expect(matchChangedFiles(['src/generated/a.ts'], selectFilters(config, 'demo'))).toEqual([]));
  it('rejects unknown repositories', () => expect(() => selectFilters(config, 'missing')).toThrow());
});


describe('central filter dependencies', () => {
  const dependencyConfig = [
    'version: 1',
    'repositories:',
    '  demo:',
    '    filters:',
    '      contracts:',
    '        paths: ["packages/contracts/**"]',
    '      api:',
    '        paths: ["apps/api/**"]',
    '        depends-on: [contracts]',
    '      manage:',
    '        paths: ["apps/manage/**"]',
    '        depends-on: [api]',
  ].join('\n');

  it('includes transitive dependencies in stable dependency-first order', () => {
    const filters = selectFilters(dependencyConfig, 'demo');
    expect(matchChangedFiles(['apps/manage/page.tsx'], filters)).toEqual(['manage', 'api', 'contracts']);
  });

  it('rejects references to unknown dependencies', () => {
    const invalid = dependencyConfig.replace('depends-on: [contracts]', 'depends-on: [missing]');
    expect(() => selectFilters(invalid, 'demo')).toThrow('Unknown dependency');
  });

  it('rejects circular dependencies', () => {
    const circular = dependencyConfig.replace('depends-on: [contracts]', 'depends-on: [manage]');
    expect(() => matchChangedFiles(['apps/manage/page.tsx'], selectFilters(circular, 'demo'))).toThrow('Circular filter dependency');
  });

  it('keeps array shorthand backwards compatible', () => {
    const legacy = 'version: 1\nrepositories:\n  demo:\n    filters:\n      app: ["src/**"]\n';
    expect(matchChangedFiles(['src/index.ts'], selectFilters(legacy, 'demo'))).toEqual(['app']);
  });
});
