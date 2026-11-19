# 🚀 Release spaceship: build, version and publish

## 🧭 Table of contents
- [🎯 How it works](#-how-it-works)
- [📝 Commit recipes](#-commit-recipes)
- [🧪 Checks](#-checks)
- [🏷️ Versioning](#️-versioning)
- [🧭 Major tag aliases](#-major-tag-aliases)
- [🔐 Permissions](#-permissions)
- [🚨 Troubleshooting](#-troubleshooting)

## 🎯 How it works
Every push to `main` runs one pipeline: install → typecheck → test → bundle → semantic-release → GitHub Release. A release is created **only when conventional commits require a version bump**. Documentation-only commits without a release keyword still build and test, but do not create an unnecessary version.

The pipeline uses `semantic-release` with the npm plugin configured as `npmPublish: false`. This publishes a **GitHub Release and git tag**, not an npm package. Bundled `dist/` and package version files are committed back to `main` with `[skip ci]` to avoid recursion. The GitHub-generated token's pushes do not normally start new push workflows.

## 📝 Commit recipes
```text
fix(paths): handle renamed files           → patch  1.0.0 → 1.0.1
feat(notify): add relay webhook             → minor  1.0.1 → 1.1.0
feat!: change action input contract         → major  1.1.0 → 2.0.0
docs: improve examples                     → no release
```

## 🧪 Checks
```bash
npm install
npm run typecheck
npm test
npm run build
test -s dist/paths-filter.js
```

## 🏷️ Versioning
Immutable tags such as `v1.2.3` are created by semantic-release. Do not use `@v1` until a moving major tag is explicitly implemented; prefer `@v1.2.3` or an immutable SHA.

## 🔐 Permissions
The release job needs `contents: write` to push its generated assets and tag, and GitHub Release permissions. Branch protection must permit the release bot to push its generated commit. If protection disallows that, use a dedicated GitHub App token with the appropriate repository installation instead.

## 🚨 Troubleshooting
- 🧱 **Protected main:** release bot cannot commit generated `dist/`; adjust rules or use a trusted App.
- 💤 **No new tag:** no `feat`, `fix`, or breaking commit since last release.
- 🔁 **Infinite loop:** ensure release commits include `[skip ci]`; avoid alternate privileged tokens that retrigger workflows.
- 📦 **No npm package:** intentional. Publishing targets GitHub Releases only.
- ⚠️ **First release:** semantic-release normally starts at `1.0.0` and needs full git history.

## 🧭 Major tag aliases

After semantic-release creates `v1.2.3`, the toolkit-based publish hook updates `v1` to the exact same commit. Consumers can use `@v1` for compatible updates or `@v1.2.3` for fixed versions. A new major version creates `v2` without moving `v1`.

> 🧪 This integration has been committed but has **not** yet been validated in a live release.
