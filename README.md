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
- [🤖 GitHub App automation](#-github-app-automation)

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
| `actions/create-pr` | Create or update pull requests using a GitHub App token |
| `actions/commit` | Atomic multi-file commits through the Git Database API |
| `actions/node-ci` | Run configurable Node test/build commands with summaries |
| `workflows/node-ci.yml` | Reusable Node test/build job |
| `workflows/paths-filter.yml` | Central per-repository path filters |\n| `workflows/filtered-ci.yml` | Dynamic parallel CI matrix from matched filters |
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

All executable action logic is TypeScript on Node 24. Run the same checks used by CI:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

The validation workflow also smoke-tests the bundled actions. Do not remove or weaken Vitest coverage to get a green build.

## 🚧 Roadmap
- [x] 📦 Shared repository and initial actions
- [x] 🧭 Documentation with navigation and examples
- [x] 🧪 Initial policy tests
- [x] 🟦 Migrate shared Node CI runner and CI summary to TypeScript / Node 24
- [x] 🤖 Add GitHub App `create-pr` and atomic `commit` actions
- [x] 🧪 Add Vitest coverage for PR helpers, file validation and branch validation
- [x] 🧪 Add mocked Octokit integration tests for PR create/update and Git Database commit sequence
- [x] 🧬 Support transitive dependencies between centralized path filters
- [x] 🛟 Select every filter on a new-branch push when no comparison base exists
- [x] 🗂️ Audit workflow inventory for userscripts-cf, photointel, shell and roteador
- [x] 🧪 Validate every central repository filter config in Vitest
- [x] 🏗️ Reusable filtered CI matrix with one job per matched filter and no-match handling\n- [x] 🏗️ Add reusable filtered CI matrix; matched filter is exposed as `ROD_CI_FILTER`
- [x] 🧩 Extract API operations from Action entrypoints for deterministic dependency-injected tests
- [ ] 🔬 Confirm latest workflow run and exercise App write permissions in an isolated test repository
- [ ] 🔬 Validate filtered matrix workflow end-to-end on a consumer repository\n- [ ] 🔔 Shared notification and auto-fix actions
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

## 🤖 GitHub App automation

The shared actions accept a short-lived installation token created by `actions/app-token`. Keep permissions minimal and never expose the token to untrusted pull-request code.

### Create or update a pull request

```yaml
- name: 🔐 Create installation token
  id: app
  uses: rodkisten/github/actions/app-token@v1
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-pull-requests: write
    permission-contents: read
- name: 🤖 Create or update PR
  id: pr
  uses: rodkisten/github/actions/create-pr@v1
  with:
    token: ${{ steps.app.outputs.token }}
    head: automation/update-lockfile
    base: main
    title: 'chore: update lockfile'
    body: 'Automated dependency update.'
    conversation-url: ${{ vars.CHATGPT_CONVERSATION_URL }}
    labels: dependencies, automated
    update-existing: 'true'
```

The action reuses an open PR for the same head/base by default. Outputs: `number`, `url`, `created`, `updated`. Its Octokit operation is extracted into `src/create-pr/operation.ts` and dependency-injected. Vitest covers create, update, duplicate prevention, labels and reviewers.

### Commit multiple files atomically

```yaml
- name: 🔐 Create installation token
  id: app
  uses: rodkisten/github/actions/app-token@v1
  with:
    app-id: ${{ secrets.BOT_APP_ID }}
    private-key: ${{ secrets.BOT_PRIVATE_KEY }}
    permission-contents: write
- name: 📝 Commit generated documentation
  uses: rodkisten/github/actions/commit@v1
  with:
    token: ${{ steps.app.outputs.token }}
    branch: automation/generated-docs
    base: main
    message: 'docs: refresh generated documentation [skip ci]'
    files: |
      [{"path":"docs/generated.md","content":"# Generated\\n"}]
```

The `files` input is a JSON array of `path`, `content`, and optional `encoding: base64`. The action creates one Git commit for all files, rejects unsafe/duplicate paths and updates refs without force. Outputs: `sha`, `branch`, `files`. The Git Database sequence is extracted into `src/commit/operation.ts`. Mocked Octokit integration tests verify branch creation, UTF-8/Base64 blob creation, a single tree/commit and a non-force ref update.

🧪 **Integration coverage:** `tests/github-actions.test.ts` exercises the PR create/update paths and the Git Database API sequence with mocked Octokit calls. No real repository writes are performed by these tests.\n\n> 🚧 These examples target the published `v1` interface. New actions and inputs must be bundled, validated and released before production callers adopt them. Current development and rollout tracking lives in [PR #5](https://github.com/rodkisten/github/pull/5).
