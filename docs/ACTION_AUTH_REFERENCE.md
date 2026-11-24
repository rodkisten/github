# GitHub App authentication and action reference

Use `app-id` and `private-key` together, or supply an existing token. App credentials take precedence; incomplete pairs fail. Installation tokens are short-lived and revoked by the official action after the job. Never print credentials. Use repository secrets and restrict App installation permissions. `push` requires a checkout; use `persist-credentials: false`. `run` dispatches a workflow, it does not wait for completion. `paths-filter` needs access to its configuration repository if private.

## app-token

Usage: `rodkisten/github/src/app-token@main`.

```yaml
name: 🤖 GitHub App token
description: Mint a scoped GitHub App installation token with automatic post-job revocation
inputs:
  app-id:
    description: GitHub App ID
    required: true
  private-key:
    description: GitHub App private key
    required: true
  owner:
    description: Installation owner (omit to scope to current repository)
    required: false
    default: ''
  repositories:
    description: Optional comma/newline-separated repositories
    required: false
  permission-contents:
    description: Contents permission
    required: false
    default: read
  permission-pull-requests:
    description: Pull requests permission
    required: false
    default: ''
  permission-issues:
    description: Issues permission
    required: false
    default: ''
  permission-actions:
    description: Actions permission
    required: false
    default: ''
outputs:
  token:
    description: Short-lived installation token
    value: ${{ steps.app.outputs.token }}
  app-slug:
    description: GitHub App slug name
    value: ${{ steps.app.outputs.app-slug }}
```

## commit

Usage: `rodkisten/github/src/commit@main`.

```yaml
name: 📝 Create commit
description: Atomically commit multiple files through the Git Database API using a GitHub App token
inputs:
  app-id:
    description: GitHub App ID for automatic authentication
    required: false
  private-key:
    description: GitHub App private key for automatic authentication
    required: false
  token:
    description: GitHub App installation token with contents write permission
    required: false
  branch:
    description: Target branch to create or update
    required: true
  base:
    description: Base branch for creating a new target branch
    required: false
  message:
    description: Commit message
    required: true
  files:
    description: JSON array of {path, content, encoding?} file changes
    required: false
  files-path:
    description: Path to JSON array of file changes; preferred for large repositories
    required: false
  author-name:
    description: Commit author and committer name
    required: false
    default: Rod GitHub App
  author-email:
    description: Commit author and committer email
    required: false
    default: github-actions[bot]@users.noreply.github.com
outputs:
  sha:
    description: Created commit SHA
    value: ${{ steps.operation.outputs.sha }}
  branch:
    description: Updated branch
    value: ${{ steps.operation.outputs.branch }}
  files:
    description: Number of files included
    value: ${{ steps.operation.outputs.files }}
```

## publish

Usage: `rodkisten/github/src/publish@main`.

```yaml
name: 📤 Publish Git changes
description: Commit changes directly or publish/update a pull request with Handlebars templates
inputs:
  app-id:
    description: GitHub App ID for automatic authentication
    required: false
  private-key:
    description: GitHub App private key for automatic authentication
    required: false
  token:
    description: GitHub token with contents:write and pull-requests:write for PR mode
    required: false
  mode:
    description: commit or pull-request
    required: true
    default: pull-request
  branch:
    description: Target branch for commit mode or automation branch for PR mode
    required: false
  base-branch:
    description: Base branch for pull requests (defaults to repository default branch)
    required: false
  commit-message:
    description: Literal commit message (use commit-message-template for Handlebars)
    required: false
  commit-message-template:
    description: Handlebars template for the commit message; takes precedence over commit-message
    required: false
  pr-title:
    description: Literal pull request title
    required: false
  pr-title-template:
    description: Handlebars template for the pull request title
    required: false
  pr-body:
    description: Literal pull request body
    required: false
  pr-body-template:
    description: Handlebars template for the pull request body
    required: false
  template-data:
    description: Additional JSON object merged into the template context
    required: false
    default: '{}'
  labels:
    description: Comma-separated labels to apply to the pull request
    required: false
  draft:
    description: Create or keep the pull request as draft
    required: false
    default: 'false'
  author-name:
    description: Git author and committer name
    required: false
  author-email:
    description: Git author and committer email
    required: false
outputs:
  commit-sha:
    description: SHA of the created commit
    value: ${{ steps.operation.outputs.commit-sha }}
  branch:
    description: Branch that received the commit
    value: ${{ steps.operation.outputs.branch }}
  pr-number:
    description: Created or updated pull request number (empty in commit mode)
    value: ${{ steps.operation.outputs.pr-number }}
  pr-url:
    description: Created or updated pull request URL (empty in commit mode)
    value: ${{ steps.operation.outputs.pr-url }}
  files:
    description: Newline-separated paths included in the commit
    value: ${{ steps.operation.outputs.files }}
```

## create-pr

Usage: `rodkisten/github/src/create-pr@main`.

```yaml
name: 🤖 Create or update pull request
description: Create or update a PR using a scoped GitHub App installation token
inputs:
  app-id:
    description: GitHub App ID for automatic authentication
    required: false
  private-key:
    description: GitHub App private key for automatic authentication
    required: false
  token:
    description: GitHub App installation token with pull-requests write permission
    required: false
  head:
    description: Head branch (owner:branch for cross-repository PRs)
    required: true
  base:
    description: Base branch (defaults to repository default branch)
    required: false
  title:
    description: Pull request title
    required: true
  body:
    description: Pull request Markdown body
    required: false
    default: ''
  conversation-url:
    description: Originating ChatGPT conversation URL, appended if absent
    required: false
  labels:
    description: Comma or newline-separated labels
    required: false
  reviewers:
    description: Comma or newline-separated GitHub usernames
    required: false
  draft:
    description: Create as draft
    required: false
    default: 'false'
  update-existing:
    description: Update an existing open PR for the same head and base
    required: false
    default: 'true'
outputs:
  number:
    description: Pull request number
    value: ${{ steps.operation.outputs.number }}
  url:
    description: Pull request URL
    value: ${{ steps.operation.outputs.url }}
  created:
    description: Whether a new PR was created
    value: ${{ steps.operation.outputs.created }}
  updated:
    description: Whether an existing PR was updated
    value: ${{ steps.operation.outputs.updated }}
```

## format-report

Usage: `rodkisten/github/src/format-report@main`.

```yaml
name: 📋 Rod Format PR Report
description: Create or update a single formatted PR summary comment
inputs:
  app-id:
    description: GitHub App ID for automatic authentication
    required: false
  private-key:
    description: GitHub App private key for automatic authentication
    required: false
  github-token:
    required: false
    description: GitHub App installation token
  pr-number:
    required: true
    description: Pull request number
  results-file:
    required: true
    description: JSON results from format action
  mode:
    default: check
  scope:
    default: changed
outputs:
  comment-updated:
    description: Whether the PR report comment was created or updated
    value: ${{ steps.operation.outputs.comment-updated }}
```

## console

Usage: `rodkisten/github/src/console@main`.

```yaml
name: 🧩 Rod Actions Console
description: Resolve central YAML settings, run optional formatting, and collect GitHub job/step notification candidates
inputs:
  app-id:
    description: GitHub App ID for automatic authentication
    required: false
  private-key:
    description: GitHub App private key for automatic authentication
    required: false
  defaults:
    description: Path to the central rod-actions.yml (checkout rodkisten/github first)
    required: true
  config:
    description: Optional repository override path
    required: false
    default: .github/rod-actions.yml
  format-mode:
    description: off, check or fix
    default: 'off'
  format-scope:
    description: changed or all
    default: changed
  format-base:
    description: Base ref for changed mode
    default: origin/main
  format-lint:
    description: Run linters during format phase
    default: 'true'
  commit-files-path:
    description: Write JSON commit payload to this local path when format-mode is fix
    required: false
  results-file:
    description: Write JSON format results to this local path
    required: false
  report:
    description: Fetch workflow job and step conclusions
    required: false
    default: 'false'
  github-token:
    description: Read-only token with actions read permission for report mode
    required: false
  events-file:
    description: Optional JSON output path for selected events
    required: false
outputs:
  notify-enabled:
    description: Whether notification dispatch is enabled in resolved configuration
    value: ${{ steps.operation.outputs.notify-enabled }}
  release-mode:
    description: Configured release mode
    value: ${{ steps.operation.outputs.release-mode }}
  event-count:
    description: Number of notification candidates
    value: ${{ steps.operation.outputs.event-count }}
  format-changed-files:
    description: JSON array of files modified by the formatter
    value: ${{ steps.operation.outputs.format-changed-files }}
  format-results:
    description: JSON array of formatter/linter tool results
    value: ${{ steps.operation.outputs.format-results }}
  suggested-commit:
    description: Suggested conventional commit message for formatted changes
    value: ${{ steps.operation.outputs.suggested-commit }}
```

## paths-filter

Usage: `rodkisten/github/src/paths-filter@main`.

```yaml
name: 🧬 Central paths filter
description: Match changed GitHub files against centralized repository YAML filters
inputs:
  app-id:
    description: GitHub App ID
    required: false
  private-key:
    description: GitHub App private key
    required: false
  token:
    description: GitHub token with contents read and pull-requests read
    required: false
  config-repository:
    description: Repository containing config/paths.yml
    required: false
    default: rodkisten/github
  config-ref:
    description: Reviewed configuration ref
    required: false
    default: main
  config-path:
    description: YAML configuration path
    required: false
    default: config/paths.yml
  base:
    description: Optional base commit or ref for push comparisons
    required: false
    default: ''
  repository-key:
    description: Override repository key
    required: false
  working-directory:
    description: Fallback project directory for filters without an override
    default: '.'
  test-command:
    description: Fallback test command
    default: npm test
  build-command:
    description: Fallback build command
    default: npm run build
  lint-command:
    description: Fallback lint command
    default: npm run lint
  run-tests:
    description: Run fallback test command
    default: 'true'
  run-build:
    description: Run fallback build command
    default: 'true'
  run-lint:
    description: Run fallback lint command
    default: 'false'
outputs:
  changes:
    description: JSON array of matching filter names
    value: ${{ steps.operation.outputs.changes }}
  any:
    description: Whether any filter matched
    value: ${{ steps.operation.outputs.any }}
  files:
    description: JSON array of changed paths
    value: ${{ steps.operation.outputs.files }}
  full-run:
    description: Whether all filters were selected as a safe initial-push fallback
    value: ${{ steps.operation.outputs.full-run }}
  matrix:
    description: JSON array of filter-specific CI task configurations
    value: ${{ steps.operation.outputs.matrix }}
```

## push

Usage: `rodkisten/github/src/push@main`.

```yaml
name: Push Git changes
description: Execute a GitHub operation with optional automatic App authentication
inputs:
  app-id:
    description: GitHub App ID
    required: false
  private-key:
    description: GitHub App private key
    required: false
  token:
    description: Existing GitHub token
    required: false
  branch:
    description: Target branch
    required: true
  working-directory:
    description: Local checkout directory
    default: '.'
```

## run

Usage: `rodkisten/github/src/run@main`.

```yaml
name: Dispatch GitHub workflow
description: Execute a GitHub operation with optional automatic App authentication
inputs:
  app-id:
    description: GitHub App ID
    required: false
  private-key:
    description: GitHub App private key
    required: false
  token:
    description: Existing GitHub token
    required: false
  workflow:
    description: Workflow filename or ID
    required: true
  ref:
    description: Branch or tag
    default: main
  inputs:
    description: JSON object of workflow inputs
    default: '{}'
```

## Examples

```yaml
- uses: rodkisten/github/src/push@main
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    branch: main
- uses: rodkisten/github/src/run@main
  with:
    token: ${{ secrets.EXISTING_TOKEN }}
    workflow: deploy.yml
    ref: main
    inputs: '{"environment":"production"}'
```

## Operation examples

All examples assume the App is installed on the target repository. Replace credentials with an existing token where supported (use github-token for console and format-report).

```yaml
- uses: rodkisten/github/src/commit@main
  id: commit
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    branch: main
    message: 'docs: update generated file'
    files: '[{"path":"example.txt","content":"hello"}]'
- uses: rodkisten/github/src/publish@main
  with:
    token: ${{ steps.auth.outputs.token }}
    mode: commit
    branch: main
    commit-message: 'chore: generated files'
- uses: rodkisten/github/src/publish@main
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    mode: pull-request
    branch: automation/generated
    pr-title: Update generated files
    commit-message: 'chore: generated files'
    draft: 'true'
- uses: rodkisten/github/src/create-pr@main
  with:
    token: ${{ steps.auth.outputs.token }}
    head: automation/generated
    base: main
    title: Update generated files
- uses: rodkisten/github/src/paths-filter@main
  with:
    token: ${{ github.token }}
- uses: rodkisten/github/src/console@main
  with:
    defaults: rod-actions.yml
    report: 'false'
- uses: rodkisten/github/src/format-report@main
  with:
    github-token: ${{ steps.auth.outputs.token }}
    pr-number: '123'
    results-file: format-results.json
```

## Troubleshooting

- Missing credentials: supply both App inputs or a token. Console can run without authentication when not fetching reports.
- HTTP 403: check installation repository access and granted permissions.
- Missing bundle: run npm ci, npm run build, then node scripts/validate-actions.mjs.
- Workflow dispatch: the workflow must support workflow_dispatch and exist on the default branch.
- Push: checkout first; non-fast-forward updates fail intentionally.
