import { describe, expect, it } from 'vitest';
import { appendConversationUrl, parseList } from '../src/create-pr/helpers.js';
import { validateChanges } from '../src/commit/validate.js';

describe('create-pr helpers', () => {
  it('parses comma and newline separated labels/reviewers', () => {
    expect(parseList('bug, enhancement\\nteam-reviewer\\r\\n')).toEqual(['bug', 'enhancement', 'team-reviewer']);
  });
  it('appends the originating conversation with real Markdown line breaks', () => {
    const body = appendConversationUrl('Automated update', 'https://chatgpt.com/share/example');
    expect(body).toContain('Automated update\\n\\n## 💬 Conversation\\nhttps://chatgpt.com/share/example');
    expect(appendConversationUrl(body, 'https://chatgpt.com/share/example')).toBe(body);
  });
  it('does not append an empty or duplicate URL', () => {
    expect(appendConversationUrl('Existing body', '')).toBe('Existing body');
    expect(appendConversationUrl('URL already here', 'URL already here')).toBe('URL already here');
  });
});

describe('commit file validation', () => {
  it('accepts safe text and base64 files', () => {
    expect(() => validateChanges([
      { path: 'docs/readme.md', content: '# Hello' },
      { path: 'assets/logo.png', content: 'aGVsbG8=', encoding: 'base64' },
    ])).not.toThrow();
  });
  it.each([
    [[], 'non-empty'],
    [[{ path: '../secret', content: 'x' }], 'Unsafe'],
    [[{ path: '/absolute', content: 'x' }], 'Unsafe'],
    [[{ path: 'same.txt', content: 'a' }, { path: 'same.txt', content: 'b' }], 'Duplicate'],
    [[{ path: 'empty.txt' }], 'Missing content'],
    [[{ path: 'file.txt', content: 'x', encoding: 'binary' }], 'Unsupported encoding'],
  ])('rejects invalid file changes', (value, message) => {
    expect(() => validateChanges(value)).toThrow(message as string);
  });
});
