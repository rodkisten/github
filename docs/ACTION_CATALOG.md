# Action catalog

Generated from public action manifests. Do not edit manually.

## Index

- [app-token](#app-token): Mint a scoped GitHub App installation token with automatic post-job revocation
- [ci-summary](#ci-summary): Write a standardized GitHub Actions job summary
- [collect-changes](#collect-changes): Collect changed and untracked files matching Git pathspecs into an atomic commit payload
- [commit](#commit): Atomically commit multiple files through the Git Database API using a GitHub App token
- [console-run](#console-run): Instrument a shell command with duration, exit code and GitHub step summary
- [console](#console): Resolve central YAML settings, run optional formatting, and collect GitHub job/step notification candidates
- [create-pr](#create-pr): Create or update a PR using a scoped GitHub App installation token
- [format-report](#format-report): Create or update a single formatted PR summary comment
- [format](#format): Detect changed or all repository files and format/lint using installed project tools
- [node-ci](#node-ci): Execute configured Node test and build commands with grouped logs and a job summary
- [paths-filter](#paths-filter): Match changed GitHub files against centralized repository YAML filters
- [publish](#publish): Commit changes directly or publish/update a pull request with Handlebars templates
- [push](#push): Execute a GitHub operation with optional automatic App authentication
- [run](#run): Execute a GitHub operation with optional automatic App authentication
- [setup-node-runner](#setup-node-runner): Node 24 TypeScript runner for verifying Node runtime and installing dependencies
- [setup-node](#setup-node): Setup Node.js with npm cache and optional deterministic install
- [setup-rodlog](#setup-rodlog): Install the published rodlog binary with SHA-256 verification
- [skip-ci](#skip-ci): Decide whether expensive CI jobs should be skipped while leaving a successful gate

## app-token

Mint a scoped GitHub App installation token with automatic post-job revocation

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | Yes |  | GitHub App ID |
| `private-key` | Yes |  | GitHub App private key |
| `owner` | No |  | Installation owner (omit to scope to current repository) |
| `repositories` | No |  | Optional comma/newline-separated repositories |
| `permission-contents` | No | read | Contents permission |
| `permission-pull-requests` | No |  | Pull requests permission |
| `permission-issues` | No |  | Issues permission |
| `permission-actions` | No |  | Actions permission |

### Outputs

| Output | Description |
|---|---|
| `token` | Short-lived installation token |
| `app-slug` | GitHub App slug name |

### Usage template

```yaml
- uses: rodkisten/github/src/app-token@main
  with:
    app-id: "<provide app-id>"
    private-key: "<provide private-key>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## ci-summary

Write a standardized GitHub Actions job summary

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `title` | No | CI report | Heading |
| `status` | Yes |  | Result status |
| `details` | No |  | Markdown details |

### Outputs

None.

### Usage template

```yaml
- uses: rodkisten/github/src/ci-summary@main
  with:
    status: "<provide status>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## collect-changes

Collect changed and untracked files matching Git pathspecs into an atomic commit payload

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `pathspecs` | Yes |  | Newline-separated Git pathspecs |

### Outputs

| Output | Description |
|---|---|
| `changed` | Whether matching files changed |
| `files-path` | Path to generated JSON payload |
| `count` | Number of collected files |

### Usage template

```yaml
- uses: rodkisten/github/src/collect-changes@main
  with:
    pathspecs: "<provide pathspecs>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## commit

Atomically commit multiple files through the Git Database API using a GitHub App token

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID for automatic authentication |
| `private-key` | No |  | GitHub App private key for automatic authentication |
| `token` | No |  | GitHub App installation token with contents write permission |
| `branch` | Yes |  | Target branch to create or update |
| `base` | No |  | Base branch for creating a new target branch |
| `message` | Yes |  | Commit message |
| `files` | No |  | JSON array of {path, content, encoding?} file changes |
| `files-path` | No |  | Path to JSON array of file changes; preferred for large repositories |
| `author-name` | No | Rod GitHub App | Commit author and committer name |
| `author-email` | No | github-actions[bot]@users.noreply.github.com | Commit author and committer email |

### Outputs

| Output | Description |
|---|---|
| `sha` | Created commit SHA |
| `branch` | Updated branch |
| `files` | Number of files included |

### Usage template

```yaml
- uses: rodkisten/github/src/commit@main
  with:
    branch: "<provide branch>"
    message: "<provide message>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## console-run

Instrument a shell command with duration, exit code and GitHub step summary

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `command` | Yes |  | Shell command to execute |
| `shell` | No | /bin/bash | Executable shell path |
| `title` | No |  | Human readable command title |

### Outputs

| Output | Description |
|---|---|
| `exit-code` | Command exit code |
| `duration-ms` | Execution duration in milliseconds |

### Usage template

```yaml
- uses: rodkisten/github/src/console-run@main
  with:
    command: "<provide command>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## console

Resolve central YAML settings, run optional formatting, and collect GitHub job/step notification candidates

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID for automatic authentication |
| `private-key` | No |  | GitHub App private key for automatic authentication |
| `defaults` | Yes |  | Path to the central rod-actions.yml (checkout rodkisten/github first) |
| `config` | No | .github/rod-actions.yml | Optional repository override path |
| `format-mode` | No | off | off, check or fix |
| `format-scope` | No | changed | changed or all |
| `format-base` | No | origin/main | Base ref for changed mode |
| `format-lint` | No | true | Run linters during format phase |
| `commit-files-path` | No |  | Write JSON commit payload to this local path when format-mode is fix |
| `results-file` | No |  | Write JSON format results to this local path |
| `report` | No | false | Fetch workflow job and step conclusions |
| `github-token` | No |  | Read-only token with actions read permission for report mode |
| `events-file` | No |  | Optional JSON output path for selected events |

### Outputs

| Output | Description |
|---|---|
| `notify-enabled` | Whether notification dispatch is enabled in resolved configuration |
| `release-mode` | Configured release mode |
| `event-count` | Number of notification candidates |
| `format-changed-files` | JSON array of files modified by the formatter |
| `format-results` | JSON array of formatter/linter tool results |
| `suggested-commit` | Suggested conventional commit message for formatted changes |

### Usage template

```yaml
- uses: rodkisten/github/src/console@main
  with:
    defaults: "<provide defaults>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## create-pr

Create or update a PR using a scoped GitHub App installation token

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID for automatic authentication |
| `private-key` | No |  | GitHub App private key for automatic authentication |
| `token` | No |  | GitHub App installation token with pull-requests write permission |
| `head` | Yes |  | Head branch (owner:branch for cross-repository PRs) |
| `base` | No |  | Base branch (defaults to repository default branch) |
| `title` | Yes |  | Pull request title |
| `body` | No |  | Pull request Markdown body |
| `conversation-url` | No |  | Originating ChatGPT conversation URL, appended if absent |
| `labels` | No |  | Comma or newline-separated labels |
| `reviewers` | No |  | Comma or newline-separated GitHub usernames |
| `draft` | No | false | Create as draft |
| `update-existing` | No | true | Update an existing open PR for the same head and base |

### Outputs

| Output | Description |
|---|---|
| `number` | Pull request number |
| `url` | Pull request URL |
| `created` | Whether a new PR was created |
| `updated` | Whether an existing PR was updated |

### Usage template

```yaml
- uses: rodkisten/github/src/create-pr@main
  with:
    head: "<provide head>"
    title: "<provide title>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## format-report

Create or update a single formatted PR summary comment

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID for automatic authentication |
| `private-key` | No |  | GitHub App private key for automatic authentication |
| `github-token` | No |  | GitHub App installation token |
| `pr-number` | Yes |  | Pull request number |
| `results-file` | Yes |  | JSON results from format action |
| `mode` | No | check |  |
| `scope` | No | changed |  |

### Outputs

| Output | Description |
|---|---|
| `comment-updated` | Whether the PR report comment was created or updated |

### Usage template

```yaml
- uses: rodkisten/github/src/format-report@main
  with:
    pr-number: "<provide pr-number>"
    results-file: "<provide results-file>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## format

Detect changed or all repository files and format/lint using installed project tools

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `mode` | No | check | check or fix |
| `scope` | No | changed | changed or all |
| `base` | No | origin/main | Git base ref for changed scope |
| `commit-files-path` | No |  | Write JSON commit payload to this local file instead of an Actions output |
| `results-file` | No |  | Write JSON report to this local path |
| `lint` | No | true | Run ESLint for JS/TS if available |

### Outputs

| Output | Description |
|---|---|
| `changed-files` | JSON array of modified paths |
| `result-json` | JSON tool results |
| `suggested-commit` | Suggested conventional commit message |

### Usage template

```yaml
- uses: rodkisten/github/src/format@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## node-ci

Execute configured Node test and build commands with grouped logs and a job summary

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `working-directory` | No | . | Project directory |
| `scope` | No |  | Matched centralized path-filter name exposed as ROD_CI_FILTER |
| `test-command` | No | npm test | Test command |
| `build-command` | No | npm run build | Build command |
| `run-tests` | No | true | Execute test command |
| `run-build` | No | true | Execute build command |
| `lint-command` | No | npm run lint | Lint command |
| `run-lint` | No | false | Execute lint command |

### Outputs

None.

### Usage template

```yaml
- uses: rodkisten/github/src/node-ci@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## paths-filter

Match changed GitHub files against centralized repository YAML filters

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID |
| `private-key` | No |  | GitHub App private key |
| `token` | No |  | GitHub token with contents read and pull-requests read |
| `config-repository` | No | rodkisten/github | Repository containing config/paths.yml |
| `config-ref` | No | main | Reviewed configuration ref |
| `config-path` | No | config/paths.yml | YAML configuration path |
| `base` | No |  | Optional base commit or ref for push comparisons |
| `repository-key` | No |  | Override repository key |
| `working-directory` | No | . | Fallback project directory for filters without an override |
| `test-command` | No | npm test | Fallback test command |
| `build-command` | No | npm run build | Fallback build command |
| `lint-command` | No | npm run lint | Fallback lint command |
| `run-tests` | No | true | Run fallback test command |
| `run-build` | No | true | Run fallback build command |
| `run-lint` | No | false | Run fallback lint command |

### Outputs

| Output | Description |
|---|---|
| `changes` | JSON array of matching filter names |
| `any` | Whether any filter matched |
| `files` | JSON array of changed paths |
| `full-run` | Whether all filters were selected as a safe initial-push fallback |
| `matrix` | JSON array of filter-specific CI task configurations |

### Usage template

```yaml
- uses: rodkisten/github/src/paths-filter@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## publish

Commit changes directly or publish/update a pull request with Handlebars templates

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID for automatic authentication |
| `private-key` | No |  | GitHub App private key for automatic authentication |
| `token` | No |  | GitHub token with contents:write and pull-requests:write for PR mode |
| `mode` | Yes | pull-request | commit or pull-request |
| `branch` | No |  | Target branch for commit mode or automation branch for PR mode |
| `base-branch` | No |  | Base branch for pull requests (defaults to repository default branch) |
| `commit-message` | No |  | Literal commit message (use commit-message-template for Handlebars) |
| `commit-message-template` | No |  | Handlebars template for the commit message; takes precedence over commit-message |
| `pr-title` | No |  | Literal pull request title |
| `pr-title-template` | No |  | Handlebars template for the pull request title |
| `pr-body` | No |  | Literal pull request body |
| `pr-body-template` | No |  | Handlebars template for the pull request body |
| `template-data` | No | {} | Additional JSON object merged into the template context |
| `labels` | No |  | Comma-separated labels to apply to the pull request |
| `draft` | No | false | Create or keep the pull request as draft |
| `author-name` | No |  | Git author and committer name |
| `author-email` | No |  | Git author and committer email |

### Outputs

| Output | Description |
|---|---|
| `commit-sha` | SHA of the created commit |
| `branch` | Branch that received the commit |
| `pr-number` | Created or updated pull request number (empty in commit mode) |
| `pr-url` | Created or updated pull request URL (empty in commit mode) |
| `files` | Newline-separated paths included in the commit |

### Usage template

```yaml
- uses: rodkisten/github/src/publish@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## push

Execute a GitHub operation with optional automatic App authentication

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID |
| `private-key` | No |  | GitHub App private key |
| `token` | No |  | Existing GitHub token |
| `branch` | Yes |  | Target branch |
| `working-directory` | No | . | Local checkout directory |

### Outputs

None.

### Usage template

```yaml
- uses: rodkisten/github/src/push@main
  with:
    branch: "<provide branch>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## run

Execute a GitHub operation with optional automatic App authentication

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `app-id` | No |  | GitHub App ID |
| `private-key` | No |  | GitHub App private key |
| `token` | No |  | Existing GitHub token |
| `workflow` | Yes |  | Workflow filename or ID |
| `ref` | No | main | Branch or tag |
| `inputs` | No | {} | JSON object of workflow inputs |

### Outputs

None.

### Usage template

```yaml
- uses: rodkisten/github/src/run@main
  with:
    workflow: "<provide workflow>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## setup-node-runner

Node 24 TypeScript runner for verifying Node runtime and installing dependencies

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `node-version` | No | 24 | Node.js version |
| `working-directory` | No | . | Project directory |
| `install` | No | true | Run npm ci / npm install |

### Outputs

| Output | Description |
|---|---|
| `node-version` | Resolved Node.js version |

### Usage template

```yaml
- uses: rodkisten/github/src/setup-node-runner@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## setup-node

Setup Node.js with npm cache and optional deterministic install

Runtime: `composite`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `node-version` | No | 24 | Node.js version |
| `working-directory` | No | . | Project directory |
| `install` | No | true | Run npm ci / npm install |
| `cache` | No | true | Enable npm dependency cache |

### Outputs

| Output | Description |
|---|---|
| `node-version` | Installed Node.js version |

### Usage template

```yaml
- uses: rodkisten/github/src/setup-node@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## setup-rodlog

Install the published rodlog binary with SHA-256 verification

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `release-base` | No | https://rodkisten.github.io/rodlog/releases | Trusted HTTPS mirror with rodlog binaries and checksums |

### Outputs

| Output | Description |
|---|---|
| `binary` | Absolute path to verified rodlog binary (or fallback wrapper) |
| `fallback` | 'true' when transparent fallback wrapper was installed |

### Usage template

```yaml
- uses: rodkisten/github/src/setup-rodlog@main
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.

## skip-ci

Decide whether expensive CI jobs should be skipped while leaving a successful gate

Runtime: `node24`

### Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `commit-message` | Yes |  | Commit message (caller supplies event-appropriate message) |
| `actor` | No | ${{ github.actor }} | GitHub actor |
| `skip-bots` | No | false | Whether bot-authored commits may skip CI |

### Outputs

| Output | Description |
|---|---|
| `skip` | true when expensive jobs should be skipped |
| `reason` | Human-readable decision |

### Usage template

```yaml
- uses: rodkisten/github/src/skip-ci@main
  with:
    commit-message: "<provide commit-message>"
```

See [authentication and operation examples](ACTION_AUTH_REFERENCE.md) for credential requirements and complete workflows.
