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

The pipeline uses `semantic-release` with the npm plugin configured as `npmPublish: false`. This publishes a **GitHub Release and git tag**, not an npm package. Bundled `dist/` and package version files are committed back to `main` with `[skip ci]` to avoid recursion. The **Rod GitHub App installation token** signs release commits and updates tags. Unlike `GITHUB_TOKEN`, App-token pushes **can trigger workflows**. Release commits use `[skip ci]`; keep the release job guarded against automation-generated commits to prevent recursive releases.

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
The release job needs `contents: write` to push its generated assets and tag, and GitHub Release permissions. Branch protection must permit the release bot to push its generated commit. The workflow authenticates with `BOT_APP_ID` (secret or variable) and `BOT_PRIVATE_KEY` (secret), using `actions/create-github-app-token@v2`. Install the App on this repository with Contents write and Issues/Pull requests write permissions. Repository rulesets must explicitly allow the App to push release commits and tags.

## 🚨 Troubleshooting
- 🧱 **Protected main:** release bot cannot commit generated `dist/`; adjust rules or use a trusted App.
- 💤 **No new tag:** no `feat`, `fix`, or breaking commit since last release.
- 🔁 **Infinite loop:** App-token pushes may trigger workflows even with `[skip ci]`; add an explicit event/commit guard to the release job and verify its behavior.
- 📦 **No npm package:** intentional. Publishing targets GitHub Releases only.
- ⚠️ **First release:** semantic-release normally starts at `1.0.0` and needs full git history.

## 🧭 Major tag aliases

After semantic-release creates `v1.2.3`, the toolkit-based publish hook updates `v1` to the exact same commit. Consumers can use `@v1` for compatible updates or `@v1.2.3` for fixed versions. A new major version creates `v2` without moving `v1`.

> 🧪 This integration has been committed but has **not** yet been validated in a live release.

## 🤖 Rod GitHub App identity

Release writes use `steps.app-token.outputs.token`, never `secrets.GITHUB_TOKEN`. Git checkout uses that token, and both Git author and committer use the App slug with `[bot]`. The lockfile repair workflow also uses the App token and API author/committer metadata. GitHub Actions itself remains the executor, but **the GitHub App is the committing identity**.

⚠️ A GitHub App token can trigger downstream workflows. Keep bot commits marked `[skip ci]` and guard release execution independently. Check repository rulesets and the App's installation permissions before a production release.
