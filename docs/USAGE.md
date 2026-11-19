# 📚 Recipes for shared CI

## 🧭 Table of contents
- [🚀 Node CI](#-node-ci)
- [🧬 Path filtering](#-path-filtering)
- [⏭️ Skip expensive work](#️-skip-expensive-work)
- [🔐 GitHub App authentication](#-github-app-authentication)
- [🧪 Local validation](#-local-validation)
- [🚨 Troubleshooting](#-troubleshooting)

> 📦 Examples target the moving `v1` tag. Verify the published release and bundle before adopting new inputs in production.

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
Filters come from `config/paths.yml`, selected by the caller's repository name. A local workflow is still needed to subscribe to GitHub events.\n\nOverride `repository-key`, `base`, `config-repository`, `config-ref` or `config-path` in `with:`. Repository-specific filters extend defaults, and identically named filters replace them.

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
