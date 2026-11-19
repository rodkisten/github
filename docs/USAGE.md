# 📚 Recipes for shared CI

## 🧭 Table of contents
- [🤖 Create or update a PR](#-create-or-update-a-pr)\n- [📝 Commit multiple files](#-commit-multiple-files)\n- [🚀 Node CI](#-node-ci)
- [🧬 Path filtering](#-path-filtering)\n- [🏗️ Filtered CI matrix](#️-filtered-ci-matrix)
- [⏭️ Skip expensive work](#️-skip-expensive-work)
- [🔐 GitHub App authentication](#-github-app-authentication)
- [🧪 Local validation](#-local-validation)
- [🚨 Troubleshooting](#-troubleshooting)

> 📦 Examples target the moving `v1` tag. Verify the published release and bundle before adopting new inputs in production.

## 🤖 Create or update a PR

Use the App token from `actions/app-token`. The action searches for an open PR with the same head and base, updates it by default, and appends the originating conversation URL when supplied.

```yaml
- name: 🔐 Authenticate Rod App
  id: app
  uses: rodkisten/github/actions/app-token@v1
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: read
    permission-pull-requests: write
- name: 🤖 Create or update PR
  id: pr
  uses: rodkisten/github/actions/create-pr@v1
  with:
    token: ${{ steps.app.outputs.token }}
    head: automation/update-lockfile
    base: main
    title: 'chore: update lockfile'
    body: 'Automated dependency lockfile update.'
    conversation-url: ${{ vars.CHATGPT_CONVERSATION_URL }}
    labels: dependencies, automated
    update-existing: 'true'
```

Outputs: `number`, `url`, `created`, `updated`. Grant only the permissions needed by the operation. For cross-repository PRs, grant the App access to both repositories and use `owner:branch` for `head`.

## 📝 Commit multiple files

The commit action creates one atomic Git commit containing all supplied file changes. It creates the target branch from `base` when it does not exist. Existing branches are updated with a non-force ref update, so concurrent or non-fast-forward changes fail safely.

```yaml
- name: 🔐 Authenticate Rod App
  id: app
  uses: rodkisten/github/actions/app-token@v1
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: write
- name: 📝 Commit generated files
  id: commit
  uses: rodkisten/github/actions/commit@v1
  with:
    token: ${{ steps.app.outputs.token }}
    branch: automation/generated-docs
    base: main
    message: 'docs: refresh generated documentation [skip ci]'
    files: |
      [{"path":"docs/generated.md","content":"# Generated\\n"}]
```

The `files` input is a JSON array with `path`, `content`, and optional `encoding: base64`. Outputs: `sha`, `branch`, `files`. Never pass untrusted user-controlled file paths or grant this token to untrusted pull-request code.

## 🚀 Node CI
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  ci:
    uses: rodkisten/github/.github/workflows/node-ci.yml@v1
    with:
      node-version: '24'
      test-command: npm run test:runtime
      build-command: npm run build
```

## 🧬 Path filtering
```yaml
name: Filtered CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  changes:
    uses: rodkisten/github/.github/workflows/paths-filter.yml@v1
    permissions:
      contents: read
      pull-requests: read
  ci:
    needs: changes
    if: contains(fromJSON(needs.changes.outputs.changes), 'runtime')
    uses: rodkisten/github/.github/workflows/node-ci.yml@v1
```
Filters come from `config/paths.yml`, selected by the caller's repository name. A local workflow is still needed to subscribe to GitHub events. Each filter can use the shorthand glob array or an object with `paths` and `depends-on`. When a changed filter declares dependencies, those dependency filters are included transitively in the output, allowing shared contracts and packages to trigger their affected consumers.\n\nOverride `repository-key`, `base`, `config-repository`, `config-ref` or `config-path` in `with:`. On the first push to a new branch, when GitHub provides an all-zero `before` SHA, the action safely selects every configured filter and exposes `full-run: true`; it never silently skips CI because no comparison base exists. The repository configuration is validated in Vitest for `userscripts-cf`, `photointel`, `shell` and `roteador`. The shared Node CI runner also accepts `lint-command` and `run-lint`; lint remains opt-in to avoid unexpectedly changing existing consumers. Example: set `run-lint: true` and `lint-command: npm run lint` on `filtered-ci.yml`. Repository-specific filters extend defaults, and identically named filters replace them.


## 🎛️ Commands per filter

Define commands alongside each path filter in the central `config/paths.yml`. A filter can override its working directory and any of the three task commands. Use `false` to explicitly disable a task; omitted commands inherit the caller defaults. Documentation-only defaults disable all build tasks.

```yaml
repositories:
  shell:
    filters:
      app:
        paths:
          - 'src/**'
        working-directory: .
        commands:
          test: false
          build: npm run build
          lint: npm run lint
      wasm:
        paths:
          - 'tools/shell-flow/**'
          - 'scripts/build-shell-flow-wasm.sh'
        commands:
          test: false
          build: npm run build
          lint: false
```

The paths-filter action resolves these settings into a JSON matrix entry for each matched filter. The reusable workflow passes the resolved `working-directory`, task commands and enable flags to `actions/node-ci`; consumers do not need per-filter `if` or `case` blocks. `ROD_CI_FILTER` remains available to scripts for additional scope-aware behavior.

## 🏗️ Filtered CI matrix

Use the reusable workflow when each matched path filter should receive an independent job. The matched filter name is exposed to commands as `ROD_CI_FILTER`, so package scripts can select the relevant workspace or test suite without duplicating workflow YAML.

```yaml
name: 🚀 Filtered CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  filtered:
    uses: rodkisten/github/.github/workflows/filtered-ci.yml@v1
    with:
      repository-key: userscripts-cf
      node-version: '24'
      working-directory: .
      test-command: npm run test:affected
      build-command: npm run build:affected
```

Each matching filter gets its own matrix job with its own resolved commands and working directory. Explicit `false` values disable tasks without falling back to generic commands. Your scripts can read `process.env.ROD_CI_FILTER` (or `$ROD_CI_FILTER` in shell) and decide which workspace to test/build. For example, `runtime` and `scripts` can run independently and in parallel. If no filter matches, a successful explanatory job runs instead of creating an empty matrix. The workflow still checks out the caller repository and installs dependencies for each matrix job; optimize this later with per-filter working directories/install policies where needed.

Inputs include the central config source (`config-repository`, `config-ref`, `config-path`), optional comparison `base`, Node version, working directory and test/build commands. Outputs expose the matched filter names and changed files.

## ⏭️ Skip expensive work
```yaml
- id: skip
  uses: rodkisten/github/actions/skip-ci@v1
  with:
    commit-message: ${{ github.event.head_commit.message }}
- if: steps.skip.outputs.skip != 'true'
  run: npm run build
```
For pull requests, resolve the head commit message explicitly: `head_commit.message` is push-specific. Never bypass mandatory security checks.

## 🔐 GitHub App authentication
```yaml
- id: auth
  uses: rodkisten/github/actions/app-token@v1
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: write
    permission-pull-requests: write
```
Use the token only in trusted jobs with minimum required permissions.

## 🧪 Local validation
```bash
npm ci
npm run typecheck
npm test
npm run build
```

## 🚨 Troubleshooting
- 🕳️ **No filters matched:** check the repository key and glob patterns in `config/paths.yml`.
- 🔒 **App authentication failed:** verify installation, App ID, private key and permissions.
- 💤 **Required check pending:** keep a stable gate job even when expensive work is skipped.
- 📦 **Unknown `@v1`:** verify the published major tag and its bundled `dist/` assets.
