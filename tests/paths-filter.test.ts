import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildFilterMatrix, matchChangedFiles, resolveMatchedFilters, selectFilters } from '../src/paths-filter/rules.js';

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


describe('repository path configuration', () => {
  const source = readFileSync(new URL('../config/paths.yml', import.meta.url), 'utf8');

  it.each(['userscripts-cf', 'photointel', 'shell', 'roteador'])('validates central rules and matrix commands for %s', repository => {
    const filters = selectFilters(source, repository);
    expect(Object.keys(filters).length).toBeGreaterThan(0);
    expect(() => buildFilterMatrix(Object.keys(filters), filters, {
      workingDirectory: '.', testCommand: 'npm test', buildCommand: 'npm run build',
      lintCommand: 'npm run lint', runTests: true, runBuild: true, runLint: false,
    })).not.toThrow();
  });

  it('selects every configured filter for a safe full-run fallback', () => {
    const filters = selectFilters(source, 'shell');
    expect(resolveMatchedFilters([], filters, true)).toEqual(Object.keys(filters));
  });

  it('uses path matching for normal comparisons', () => {
    const filters = selectFilters(source, 'shell');
    expect(resolveMatchedFilters(['src/main.ts'], filters)).toEqual(['validation']);
    expect(resolveMatchedFilters(['README.md'], filters)).toEqual(['documentation']);
  });
});

describe('per-filter command matrix', () => {
  const defaults = {
    workingDirectory: '.',
    testCommand: 'npm test',
    buildCommand: 'npm run build',
    lintCommand: 'npm run lint',
    runTests: true,
    runBuild: true,
    runLint: false,
  };

  it('overrides fallback commands per filter and supports explicit task opt-out', () => {
    const config = [
      'version: 1',
      'repositories:',
      '  demo:',
      '    filters:',
      '      app:',
      '        paths: ["src/**"]',
      '        working-directory: apps/web',
      '        commands:',
      '          test: "npm run test:web"',
      '          build: "npm run build:web"',
      '          lint: false',
      '      docs:',
      '        paths: ["docs/**"]',
      '        commands:',
      '          test: false',
      '          build: false',
      '          lint: "npm run docs:lint"',
    ].join('\n');
    const filters = selectFilters(config, 'demo');
    expect(buildFilterMatrix(['app', 'docs'], filters, defaults)).toEqual([
      {
        filter: 'app',
        'working-directory': 'apps/web',
        'test-command': 'npm run test:web',
        'build-command': 'npm run build:web',
        'lint-command': 'npm run lint',
        'run-tests': true,
        'run-build': true,
        'run-lint': false,
      },
      {
        filter: 'docs',
        'working-directory': '.',
        'test-command': 'npm test',
        'build-command': 'npm run build',
        'lint-command': 'npm run docs:lint',
        'run-tests': false,
        'run-build': false,
        'run-lint': true,
      },
    ]);
  });

  it('rejects invalid per-filter commands', () => {
    const config = 'version: 1\nrepositories:\n  demo:\n    filters:\n      app:\n        paths: ["src/**"]\n        commands:\n          build: 42\n';
    expect(() => selectFilters(config, 'demo')).toThrow('Invalid build command');
  });

  it('rejects unknown filters when constructing the matrix', () => {
    const filters = selectFilters('version: 1\nrepositories:\n  demo:\n    filters:\n      app: ["src/**"]\n', 'demo');
    expect(() => buildFilterMatrix(['missing'], filters, defaults)).toThrow('Unknown filter');
  });
});
