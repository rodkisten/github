# 📚 Recipes for shared CI

## 🧭 Table of contents
- [🚀 Node CI](#-node-ci)
- [🧬 Path filtering](#-path-filtering)
- [⏭️ Skip expensive work](#️-skip-expensive-work)
- [🔐 GitHub App authentication](#-github-app-authentication)
- [🧪 Local validation](#-local-validation)
- [🚨 Troubleshooting](#-troubleshooting)

> ⚠️ All examples use the planned `v1` release. It does **not** exist yet. Publish and validate before using these snippets in production.

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
Filters come from `config/paths.yml`, selected by the caller's repository name. A local workflow is still needed to subscribe to GitHub events.

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
    app-id: ${{ vars.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: write
    permission-pull-requests: write
```
Use the token only in trusted jobs with minimum required permissions.

## 🧪 Local validation
```bash
python -m pip install 'PyYAML==6.0.2'
python -m unittest discover -s tests -v
```

## 🚨 Troubleshooting
- 🕳️ **No filters matched:** check the repository key and glob patterns in `config/paths.yml`.
- 🔒 **App authentication failed:** verify installation, App ID, private key and permissions.
- 💤 **Required check pending:** keep a stable gate job even when expensive work is skipped.
- 📦 **Unknown `@v1`:** the shared workflow release has not been published yet.
