# 🔒 npm Lockfile Repair

## 🧭 Table of contents
- [🚀 How to run](#-how-to-run)
- [🧰 What it does](#-what-it-does)
- [🛡️ Safety](#️-safety)
- [🧪 Example](#-example)
- [🚨 Troubleshooting](#-troubleshooting)

## 🚀 How to run
Open **Actions → 🔒 Repair npm lockfile → Run workflow** on the desired branch. The workflow also runs on same-repository pull requests that modify `package.json`.

## 🧰 What it does
1. 📥 Checks out the exact PR commit.
2. 🟩 Uses Node 24.
3. 📦 Runs `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`.
4. 🔎 Checks manifest-to-lockfile dependency ranges.
5. 📝 Writes the lockfile through `actions/github-script@v8` and the GitHub Contents API, **only if changed**.
6. 💤 Does nothing if the lockfile is already synchronized.

## 🛡️ Safety
- 🧱 Fork PRs do not receive write credentials and are skipped.
- 🔁 A lockfile-only commit does not retrigger this workflow because the PR path filter watches `package.json`, not `package-lock.json`.
- 🧪 The generated commit does not use `[skip ci]`, preserving required PR checks.
- 🔐 `contents: write` is required. Protected branches may reject API writes.
- ⚠️ Concurrent changes can cause a conflict. Rerun after synchronizing the branch.

## 🧪 Example
```bash
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
npm ci --ignore-scripts
```

## 🚨 Troubleshooting
- 🔒 **403:** inspect repository Actions permissions and branch protection.
- 📦 **Dependency resolution failure:** fix incompatible package ranges in `package.json`.
- 💤 **No commit:** lockfile was already current.
- 🌍 **Fork PR:** run from a trusted branch instead of granting write tokens to untrusted code.
