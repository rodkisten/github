# 🚀 Hybrid release

Reusable workflow: `.github/workflows/hybrid-release.yml`.

## Modes
- `auto`: Conventional Commits (feat → minor, fix → patch, BREAKING CHANGE / ! → major); no releasable commits means no release.
- `major`, `minor`, `patch`: explicitly bump the latest SemVer tag.
- `exact`: publish the supplied exact version.

If no SemVer tags exist, bootstrap from `initial-version` (default `1.0.0`). Tags are `vMAJOR.MINOR.PATCH`. Existing release/tag conflicts are rejected, and reruns for an already published release are no-ops. Existing tag must refer to the same commit. Use `dry-run` to preview.

## Caller

```yaml
name: Release
on:
  workflow_dispatch:
jobs:
  release:
    uses: rodkisten/github/.github/workflows/hybrid-release.yml@main
    permissions:
      contents: read
    with:
      mode: auto
      initial-version: 1.0.0
      assets: |
        dist/**/*.zip
        dist/**/*.tar.gz
      build-command: npm ci && npm run build
    secrets:
      BOT_APP_ID: ${{ secrets.BOT_APP_ID }}
      BOT_PRIVATE_KEY: ${{ secrets.BOT_PRIVATE_KEY }}
```

The reusable workflow authenticates via `actions/create-github-app-token@v2` with `contents:write`. App installation must include the caller repository. Do not run untrusted PR code with a write token. Use immutable refs in production. The optional build command is trusted workflow configuration, not user input. The workflow intentionally does not push a mutable `v1` tag; the existing central semantic-release plugin manages that tag for the shared action repository.

## Outputs
- `tag`: planned or published tag.
- `published`: `true` only when this run creates a GitHub Release.

## Existing central release
The existing `release.yml` and `.releaserc.json` remain unchanged. They continue to manage releases for `rodkisten/github`. Avoid triggering both publishing workflows for the same repository and commit.
