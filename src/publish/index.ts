import * as core from '@actions/core';
import * as github from '@actions/github';
import Handlebars from 'handlebars';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

type Octokit = ReturnType<typeof github.getOctokit>;

function registerHelpers() {
  Handlebars.registerHelper('upper', (value: unknown) => String(value ?? '').toUpperCase());
  Handlebars.registerHelper('lower', (value: unknown) => String(value ?? '').toLowerCase());
  Handlebars.registerHelper('json', (value: unknown) => JSON.stringify(value, null, 2));
  Handlebars.registerHelper('default', (value: unknown, fallback: unknown) => value || fallback);
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('date', (value?: string | number, format?: string) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) throw new Error('Invalid date passed to {{date}}');
    return format === 'iso' ? date.toISOString() : date.toISOString().slice(0, 10);
  });
}

function render(template: string, context: Record<string, unknown>, label: string): string {
  try {
    return Handlebars.compile(template, { noEscape: true, strict: true })(context).trim();
  } catch (error) {
    throw new Error(`Cannot render ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function changedPaths(baseRef: string): string[] {
  const tracked = git(['diff', '--name-only', '-z', baseRef, '--']).split('\0').filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

async function createTree(octokit: Octokit, owner: string, repo: string, baseTree: string, paths: string[]) {
  const tree = [];
  for (const path of paths) {
    if (!existsSync(path)) {
      tree.push({ path, mode: '100644' as const, type: 'blob' as const, sha: null });
      continue;
    }
    const stat = lstatSync(path);
    if (stat.isDirectory()) continue;
    const mode = stat.isSymbolicLink() ? '120000' : (stat.mode & 0o111) !== 0 ? '100755' : '100644';
    const bytes = stat.isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path);
    const blob = await octokit.rest.git.createBlob({
      owner, repo, content: bytes.toString('base64'), encoding: 'base64',
    });
    tree.push({ path, mode, type: 'blob' as const, sha: blob.data.sha });
  }
  const result = await octokit.rest.git.createTree({ owner, repo, base_tree: baseTree, tree });
  return result.data.sha;
}

async function getBranch(octokit: Octokit, owner: string, repo: string, branch: string) {
  try {
    const result = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
    return result.data.object.sha;
  } catch (error) {
    if ((error as { status?: number }).status === 404) return undefined;
    throw error;
  }
}

async function publish() {
  registerHelpers();
  const token = core.getInput('token', { required: true });
  const mode = core.getInput('mode', { required: true });
  if (mode !== 'commit' && mode !== 'pull-request') throw new Error('mode must be commit or pull-request');

  const context = github.context;
  const [owner, repo] = context.repo.owner && context.repo.repo
    ? [context.repo.owner, context.repo.repo]
    : ['', ''];
  if (!owner || !repo) throw new Error('Cannot resolve repository from GitHub context');

  const baseBranch = core.getInput('base-branch') || context.payload.repository?.default_branch || 'main';
  const requestedBranch = core.getInput('branch');
  const branch = mode === 'commit'
    ? (requestedBranch || context.ref.replace(/^refs\/heads\//, ''))
    : (requestedBranch || `automation/${context.workflow.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.startsWith('/') || branch.endsWith('/') || branch.includes('..')) {
    throw new Error(`Invalid branch name: ${branch}`);
  }

  let custom: Record<string, unknown> = {};
  const rawData = core.getInput('template-data');
  if (rawData) {
    try { custom = JSON.parse(rawData) as Record<string, unknown>; }
    catch { throw new Error('template-data must be a valid JSON object'); }
    if (!custom || Array.isArray(custom) || typeof custom !== 'object') throw new Error('template-data must be a JSON object');
  }

  const octokit = github.getOctokit(token);
  const existingBranchSha = mode === 'pull-request' ? await getBranch(octokit, owner, repo, branch) : undefined;
  const baseRef = existingBranchSha || await getBranch(octokit, owner, repo, mode === 'commit' ? branch : baseBranch);
  if (!baseRef) throw new Error(`Cannot find base branch: ${mode === 'commit' ? branch : baseBranch}`);
  const baseCommit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: baseRef });
  const paths = changedPaths('HEAD');
  if (paths.length === 0) throw new Error('There are no changed or untracked files to publish');

  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${context.runId}`;
  const templateContext = {
    repository: `${owner}/${repo}`, owner, repo, branch, baseBranch,
    sha: context.sha, shortSha: context.sha.slice(0, 7), actor: context.actor,
    workflow: context.workflow, runId: context.runId, runNumber: context.runNumber,
    runUrl, eventName: context.eventName, ref: context.ref, refName: context.ref.replace(/^refs\/(heads|tags)\//, ''),
    prNumber: context.payload.pull_request?.number ?? null,
    timestamp: new Date().toISOString(), files: paths, fileCount: paths.length,
    inputs: (context.payload.inputs as Record<string, unknown> | undefined) ?? {},
    ...custom,
  };

  const messageTemplate = core.getInput('commit-message-template')
    || core.getInput('commit-message')
    || 'chore: automated update';
  const message = render(messageTemplate, templateContext, 'commit message');
  if (!message) throw new Error('Rendered commit message cannot be empty');

  const tree = await createTree(octokit, owner, repo, baseCommit.data.tree.sha, paths);
  const authorName = core.getInput('author-name') || `${context.actor}`;
  const authorEmail = core.getInput('author-email') || `${context.actor}@users.noreply.github.com`;
  const commit = await octokit.rest.git.createCommit({
    owner, repo, message, tree, parents: [baseRef],
    author: { name: authorName, email: authorEmail },
    committer: { name: authorName, email: authorEmail },
  });

  const existing = await getBranch(octokit, owner, repo, branch);
  if (existing) {
    await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha, force: false });
  } else {
    await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: commit.data.sha });
  }

  core.setOutput('commit-sha', commit.data.sha);
  core.setOutput('branch', branch);
  core.setOutput('files', paths.join('\n'));

  if (mode === 'commit') {
    core.setOutput('pr-number', '');
    core.setOutput('pr-url', '');
    core.info(`Published ${paths.length} file(s) to ${owner}/${repo}@${branch}`);
    return;
  }

  const titleTemplate = core.getInput('pr-title-template') || core.getInput('pr-title')
    || 'chore: automated update';
  const bodyTemplate = core.getInput('pr-body-template') || core.getInput('pr-body')
    || [
      '## Summary',
      '',
      'Automated changes published by **{{workflow}}**.',
      '',
      '- Repository: `{{repository}}`',
      '- Commit: `{{shortSha}}`',
      '- Files changed: {{fileCount}}',
      '- Source: [workflow run]({{runUrl}})',
      '',
      '### Changed files',
      '{{#each files}}- `{{this}}`',
      '{{/each}}',
    ].join('\n');
  const title = render(titleTemplate, templateContext, 'pull request title');
  const body = render(bodyTemplate, templateContext, 'pull request body');
  if (!title) throw new Error('Rendered pull request title cannot be empty');

  const head = `${owner}:${branch}`;
  const open = await octokit.rest.pulls.list({ owner, repo, state: 'open', head, base: baseBranch });
  let pull;
  if (open.data.length) {
    const updated = await octokit.rest.pulls.update({
      owner, repo, pull_number: open.data[0].number, title, body,
      draft: core.getBooleanInput('draft'),
    });
    pull = updated.data;
  } else {
    const created = await octokit.rest.pulls.create({
      owner, repo, head: branch, base: baseBranch, title, body,
      draft: core.getBooleanInput('draft'),
    });
    pull = created.data;
  }
  const labels = core.getInput('labels').split(',').map((label) => label.trim()).filter(Boolean);
  if (labels.length) await octokit.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels });
  core.setOutput('pr-number', String(pull.number));
  core.setOutput('pr-url', pull.html_url);
  core.info(`Pull request #${pull.number}: ${pull.html_url}`);
}

publish().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
