import { describe, expect, it, vi } from 'vitest';
import { createOrUpdatePullRequest } from '../src/create-pr/operation.js';
import { createAtomicCommit } from '../src/commit/operation.js';
import { appendConversationUrl, parseList } from '../src/create-pr/helpers.js';
import { validateChanges } from '../src/commit/validate.js';
import { validateBranchName } from '../src/utils/git.js';

describe('create-pr helpers', () => {
  it('parses comma and newline separated labels/reviewers', () => {
    expect(parseList('bug, enhancement\nteam-reviewer\r\n')).toEqual([
      'bug',
      'enhancement',
      'team-reviewer',
    ]);
  });
  it('appends the originating conversation with real Markdown line breaks', () => {
    const body = appendConversationUrl('Automated update', 'https://chatgpt.com/share/example');
    expect(body).toBe(
      ['Automated update', '## 💬 Conversation', 'https://chatgpt.com/share/example'].join(
        String.fromCharCode(10, 10)
      )
    );
    expect(appendConversationUrl(body, 'https://chatgpt.com/share/example')).toBe(body);
  });
  it('does not append an empty or duplicate URL', () => {
    expect(appendConversationUrl('Existing body', '')).toBe('Existing body');
    expect(appendConversationUrl('URL already here', 'URL already here')).toBe('URL already here');
  });
});

describe('commit file validation', () => {
  it('accepts safe text and base64 files', () => {
    expect(() =>
      validateChanges([
        { path: 'docs/readme.md', content: '# Hello' },
        { path: 'assets/logo.png', content: 'aGVsbG8=', encoding: 'base64' },
      ])
    ).not.toThrow();
  });
  it.each([
    [[], 'non-empty'],
    [[{ path: '../secret', content: 'x' }], 'Unsafe'],
    [[{ path: '/absolute', content: 'x' }], 'Unsafe'],
    [
      [
        { path: 'same.txt', content: 'a' },
        { path: 'same.txt', content: 'b' },
      ],
      'Duplicate',
    ],
    [[{ path: 'empty.txt' }], 'Missing content'],
    [[{ path: 'file.txt', content: 'x', encoding: 'binary' }], 'Unsupported encoding'],
  ])('rejects invalid file changes', (value, message) => {
    expect(() => validateChanges(value)).toThrow(message as string);
  });
});

describe('commit branch validation', () => {
  it.each(['main', 'automation/update-lockfile', 'release/v1.2.3'])(
    'accepts valid branch %s',
    (branch) => {
      expect(() => validateBranchName(branch)).not.toThrow();
    }
  );
  it.each([
    '',
    '/main',
    'main/',
    'feature//branch',
    '../main',
    'branch name',
    'main.lock',
    'x\\y',
  ])('rejects invalid branch %s', (branch) => {
    expect(() => validateBranchName(branch)).toThrow('Invalid Git branch name');
  });
});

describe('create-pr Octokit integration', () => {
  const options = {
    owner: 'rodkisten',
    repo: 'github',
    head: 'automation/docs',
    base: 'main',
    title: 'chore: update docs',
    body: 'Generated',
    draft: false,
    updateExisting: true,
    labels: ['automation'],
    reviewers: ['rod'],
  };

  it('creates a PR and applies labels/reviewers', async () => {
    const calls: string[] = [];
    const octokit = {
      paginate: vi.fn().mockResolvedValue([]),
      rest: {
        pulls: {
          list: vi.fn(),
          create: vi.fn().mockImplementation(async () => {
            calls.push('create');
            return { data: { number: 12, html_url: 'https://github.com/rodkisten/github/pull/12' } };
          }),
          update: vi.fn(),
          requestReviewers: vi.fn().mockImplementation(async () => {
            calls.push('reviewers');
          }),
        },
        issues: {
          addLabels: vi.fn().mockImplementation(async () => {
            calls.push('labels');
          }),
        },
      },
    };
    const result = await createOrUpdatePullRequest(octokit as never, options);
    expect(result).toEqual({
      number: 12,
      url: 'https://github.com/rodkisten/github/pull/12',
      created: true,
      updated: false,
    });
    expect(calls).toEqual(['create', 'labels', 'reviewers']);
  });

  it('updates an existing PR instead of creating a duplicate', async () => {
    const octokit = {
      paginate: vi.fn().mockResolvedValue([{ number: 7 }]),
      rest: {
        pulls: {
          list: vi.fn(),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({
            data: { number: 7, html_url: 'https://github.com/rodkisten/github/pull/7' },
          }),
          requestReviewers: vi.fn(),
        },
        issues: { addLabels: vi.fn() },
      },
    };
    const result = await createOrUpdatePullRequest(octokit as never, {
      ...options,
      labels: [],
      reviewers: [],
    });
    expect(result).toEqual({
      number: 7,
      url: 'https://github.com/rodkisten/github/pull/7',
      created: false,
      updated: true,
    });
    expect(octokit.rest.pulls.create).not.toHaveBeenCalled();
  });

  it('refuses to overwrite an existing PR when update is disabled', async () => {
    const octokit = {
      paginate: vi.fn().mockResolvedValue([{ number: 8 }]),
      rest: {
        pulls: { list: vi.fn(), update: vi.fn(), create: vi.fn() },
        issues: { addLabels: vi.fn() },
      },
    };
    await expect(
      createOrUpdatePullRequest(octokit as never, { ...options, updateExisting: false })
    ).rejects.toThrow('PR #8 already exists');
    expect(octokit.rest.pulls.update).not.toHaveBeenCalled();
  });
});

describe('commit Git Database API integration', () => {
  it('creates blobs, one tree, one commit and updates the ref without force', async () => {
    const calls: string[] = [];
    const octokit = {
      rest: {
        git: {
          getRef: vi
            .fn()
            .mockRejectedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ data: { object: { sha: 'base-sha' } } }),
          createRef: vi.fn().mockImplementation(async () => {
            calls.push('create-ref');
          }),
          getCommit: vi.fn().mockResolvedValue({ data: { tree: { sha: 'parent-tree' } } }),
          createBlob: vi.fn().mockImplementation(async ({ encoding }) => {
            calls.push('blob:' + encoding);
            return { data: { sha: 'blob-sha' } };
          }),
          createTree: vi.fn().mockImplementation(async () => {
            calls.push('tree');
            return { data: { sha: 'tree-sha' } };
          }),
          createCommit: vi.fn().mockImplementation(async () => {
            calls.push('commit');
            return { data: { sha: 'new-commit' } };
          }),
          updateRef: vi.fn().mockImplementation(async (args) => {
            calls.push('update-ref');
            expect(args.force).toBe(false);
          }),
        },
      },
    };
    const result = await createAtomicCommit(octokit as never, {
      owner: 'rodkisten',
      repo: 'github',
      branch: 'automation/docs',
      base: 'main',
      message: 'docs: update',
      files: [
        { path: 'README.md', content: '# Hello' },
        { path: 'assets/logo.png', content: 'aGVsbG8=', encoding: 'base64' },
      ],
      authorName: 'Rod GitHub App',
      authorEmail: 'bot@example.test',
    });
    expect(result).toEqual({ sha: 'new-commit', branch: 'automation/docs', files: 2 });
    expect(calls).toEqual([
      'create-ref',
      'blob:utf-8',
      'blob:base64',
      'tree',
      'commit',
      'update-ref',
    ]);
  });

  it('does not create a branch when it already exists', async () => {
    const git = {
      getRef: vi.fn().mockResolvedValue({ data: { object: { sha: 'branch-sha' } } }),
      createRef: vi.fn(),
      getCommit: vi.fn().mockResolvedValue({ data: { tree: { sha: 'parent-tree' } } }),
      createBlob: vi.fn().mockResolvedValue({ data: { sha: 'blob' } }),
      createTree: vi.fn().mockResolvedValue({ data: { sha: 'tree' } }),
      createCommit: vi.fn().mockResolvedValue({ data: { sha: 'commit' } }),
      updateRef: vi.fn(),
    };
    await createAtomicCommit({ rest: { git } } as never, {
      owner: 'rodkisten',
      repo: 'github',
      branch: 'automation/docs',
      base: 'main',
      message: 'docs: update',
      files: [{ path: 'README.md', content: '# Hello' }],
      authorName: 'Bot',
      authorEmail: 'bot@example.test',
    });
    expect(git.createRef).not.toHaveBeenCalled();
  });
});
