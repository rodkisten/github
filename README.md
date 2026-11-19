# 🦾 Rod GitHub Automation

> 🧰 One shared toolbox for CI/CD across Rod's repositories. Less copy-paste, more shipping.

## 🧭 Table of contents
- [🚀 Quick start](#-quick-start)
- [🧩 What's inside](#-whats-inside)
- [🗺️ Architecture](#️-architecture)
- [📚 Recipes](#-recipes)
- [🛡️ Security and releases](#️-security-and-releases)
- [🧪 Validation](#-validation)
- [🚧 Roadmap](#-roadmap)
- [🚀 Release pipeline](#-release-pipeline)
- [🌈 rodlog integration](#-rodlog-integration)

## 🚀 Quick start
Use a reusable workflow from your own repository:

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

⚠️ `@v1` is a **future release**, not published yet. Do not migrate production callers until a tested tag exists.

## 🧩 What's inside
| 🧱 Component | 🎯 Purpose |
| --- | --- |
| `actions/app-token` | Short-lived GitHub App token |
| `actions/skip-ci` | Optional expensive-job skip decision |
| `actions/setup-node` | Node and npm cache |
| `actions/ci-summary` | Markdown job summary |
| `workflows/node-ci.yml` | Reusable Node test/build job |
| `workflows/paths-filter.yml` | Central per-repository path filters |
| `config/paths.yml` | Shared glob rules |

## 🗺️ Architecture
```text
Repository workflow (events and permissions)
  ├── shared paths-filter → selected jobs
  └── shared node-ci → setup-node → tests/build → summary
```

## 📚 Recipes
- [🧪 Node CI, 🔐 GitHub App, ⏭️ Skip CI](docs/USAGE.md)
- [🏗️ Architecture and rollout checklist](docs/ARCHITECTURE.md)

## 🛡️ Security and releases
Use least-privilege permissions. Never expose App tokens to untrusted PR code. Pin reusable actions to reviewed tags or immutable SHAs. GitHub events still need local caller workflows.

## 🧪 Validation
```bash
python -m pip install 'PyYAML==6.0.2'
python -m unittest discover -s tests -v
```

## 🚧 Roadmap
- [x] 📦 Shared repository and initial actions
- [x] 🧭 Documentation with navigation and examples
- [x] 🧪 Initial policy tests
- [ ] 🔬 Confirm live workflow runs and fix failures
- [ ] 🔔 Shared notification and auto-fix actions
- [ ] 🧹 Audit and migrate repositories, then remove redundant workflows

💬 [Conversation and decisions](https://chatgpt.com/share/6afec44b-5bf8-83ea-83d0-ae099d383b94?ogimg=plain)

## 🟦 TypeScript / Node 24 migration

The shared path-filter implementation now lives in `src/paths-filter/` and uses `@actions/core`, `@actions/github`, `yaml` and `picomatch`. The new JavaScript action is **not production-ready until `dist/paths-filter.js` is bundled and committed**.

### 🧪 Developer commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

### 🧬 Action usage (after bundling and release)

```yaml
- uses: rodkisten/github/actions/paths-filter@v1
  id: changes
  with:
    token: ${{ github.token }}
    config-ref: v1
```

Grant `contents: read` and `pull-requests: read` to the calling job. The action intentionally fails closed when GitHub's comparison results might be truncated. The existing Python dispatcher is legacy and will be replaced after the TypeScript action passes integration tests.

## 🚀 Release pipeline

Every push to `main` runs **one build, test and semantic-release workflow**. GitHub Releases and version tags are generated from Conventional Commits, while documentation-only commits run checks without creating a version. See [🚀 Release guide](docs/RELEASING.md) for the complete ToC, examples, permissions and troubleshooting.

## 🌈 rodlog integration

Our PR and release workflows install the verified Go-powered `rodlog` binary for TypeScript, Vitest and bundle diagnostics. See [🌈 rodlog guide](docs/RODLOG.md) for copy-paste recipes, output modes and security notes.
