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
- [📤 Publish action](#-publish-action)

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

⚠️ `@v1` is a future release until a tested tag exists. Pin production callers to a reviewed tag or immutable SHA.

## 🧩 What's inside
| Component | Purpose |
| --- | --- |
| `actions/app-token` | Short-lived GitHub App token |
| `actions/skip-ci` | Optional expensive-job skip decision |
| `actions/setup-node` | Node and npm cache |
| `actions/ci-summary` | Markdown job summary |
| `actions/paths-filter` | TypeScript path filter |
| `actions/publish` | Commit or create/update a PR with Handlebars templates |

## 🗺️ Architecture
```text
Repository workflow
  ├── shared paths-filter → selected jobs
  ├── shared publish → Git Database API → commit or pull request
  └── shared node-ci → setup-node → tests/build → summary
```

## 📚 Recipes
- [Usage and reusable action examples](docs/USAGE.md)
- [Architecture and rollout checklist](docs/ARCHITECTURE.md)
- [Publish action templates](docs/PUBLISH.md)

## 🛡️ Security and releases
Use least-privilege permissions. Never expose App tokens to untrusted PR code. Pin reusable actions to reviewed tags or immutable SHAs. GitHub events still need local caller workflows.

## 🧪 Validation
```bash
npm install
npm run typecheck
npm test
npm run build
```

## 🚧 Roadmap
- [x] Shared repository and initial actions
- [x] TypeScript actions with bundled outputs
- [x] Central commit / PR publishing with templates
- [ ] Run live integration tests and publish a stable version
- [ ] Shared notification and auto-fix actions
- [ ] Audit and migrate repositories, then remove redundant workflows

## 🚀 Release pipeline
Every push to `main` runs one build, test and semantic-release workflow. GitHub Releases and version tags are generated from Conventional Commits. See [Releasing](docs/RELEASING.md).

## 🌈 rodlog integration
See [rodlog guide](docs/RODLOG.md) for copy-paste recipes and diagnostics.

## 📤 Publish action
The shared `actions/publish` action commits changes directly or creates/updates a PR. It uses Handlebars for commit messages, PR titles and PR bodies. See [complete template reference](docs/PUBLISH.md).
