# Usage examples

The examples below use the implementation branch for review only. Publish a reviewed immutable SHA or release tag before migration.

## Node CI caller

```yaml
name: Node CI
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

## Skip decision

```yaml
- uses: rodkisten/github/actions/skip-ci@v1
  id: skip
  with:
    commit-message: ${{ github.event.head_commit.message }}
- if: steps.skip.outputs.skip != 'true'
  run: npm run build
```

Do not use a skip marker to bypass protected security checks. In PRs, head_commit.message may be empty; resolve the PR head commit message explicitly.

## GitHub App token

```yaml
- uses: rodkisten/github/actions/app-token@v1
  id: auth
  with:
    app-id: ${{ vars.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: write
    permission-pull-requests: write
```

Keep privileged jobs away from untrusted pull request code. Avoid passing a privileged token to build scripts.
