import { describe, expect, it } from 'vitest';
import Handlebars from 'handlebars';

describe('publish templates', () => {
  it('renders standard repository and run variables', () => {
    const template = Handlebars.compile('chore({{repo}}): {{shortSha}} · {{fileCount}} files', { noEscape: true });
    expect(template({ repo: 'photointel', shortSha: 'abc1234', fileCount: 3 }))
      .toBe('chore(photointel): abc1234 · 3 files');
  });

  it('supports loops, conditionals and custom nested data', () => {
    const template = Handlebars.compile('{{#if release}}release {{version}}{{else}}update{{/if}}: {{#each files}}{{this}} {{/each}}', { noEscape: true });
    expect(template({ release: true, version: '1.2.0', files: ['a.ts', 'b.ts'] }))
      .toBe('release 1.2.0: a.ts b.ts ');
  });

  it('supports registered helpers', () => {
    Handlebars.registerHelper('upper', (value: string) => value.toUpperCase());
    const template = Handlebars.compile('{{upper name}}');
    expect(template({ name: 'rod' })).toBe('ROD');
  });
});
