# 🧩 Rod Actions Console · Architecture proposal

This is a design proposal, not an enabled notification system.

## Goal
Centralized typed configuration and event hooks shared by CI, release, deploy, PR and notification actions.

## Configuration resolution
1. Defaults in `rodkisten/github/config/rod-actions.yml`
2. Repository `.github/rod-actions.yml`
3. Workflow inputs and explicit CLI flags

Merge objects recursively, replace arrays explicitly, validate schema, reject unknown keys in strict mode. Never store credentials in YAML.

## Event model
`command.started`, `command.succeeded`, `command.failed`, `step.succeeded`, `step.failed`, `job.completed`, `workflow.completed`, `release.published`.

Each event includes repository, run_id, job, step_id (when available), timestamp, status, duration, SHA, and dedupe key.

### GitHub Actions limitations
Shell wrappers only see commands in instrumented `run` steps; they cannot intercept `uses:` actions. `GITHUB_ENV` and `BASH_ENV` can inject environment and bash initialization into later compatible steps, but cannot reliably determine the GitHub step result for arbitrary third-party actions. Use a final `if: always()` reporting step and `workflow_run`/GitHub API for complete job/workflow outcomes. Step-level notifications for arbitrary `uses:` steps require inspecting the GitHub jobs API after the job finishes, not a synchronous shell hook.

## Example configuration
```yaml
version: 1
console:
  enabled: true
  renderer: rodlog
hooks:
  shell:
    enabled: true
    notifyOn: [failure]
  github:
    enabled: true
    notifyOn: [step.failure, job.completed, release.published]
notify:
  provider: relay
  debounceSeconds: 5
  ignore: [cancelled, skipped]
  groupBy: [repository, run_id]
release:
  mode: hybrid
  initialVersion: 1.0.0
  artifacts: [dist/**/*.zip, dist/**/*.tar.gz]
```

## Implementation phases
1. TypeScript schema, config merge, tests and CLI resolver.
2. Console wrapper action with structured rodlog output and shell hooks.
3. Post-job reporter collecting GitHub step conclusions, with deduplication and Relay transport.
4. Migrate shared release and CI workflows to consume resolved configuration.
5. Opt-in per-repository rollout, failure-only by default to avoid notification storms.

## Security
No secrets in config, no arbitrary untrusted hooks in privileged jobs, no write tokens in PR builds, and webhook signature verification where applicable. Respect existing `notify.yml` repository settings by merging rather than replacing them. Prevent recursive notifications from the notification workflow itself.

## Implemented action (opt-in)

The Action is at `actions/console/action.yml`, bundled from `src/console/index.ts`. It resolves defaults and optional overrides, and in report mode reads job/step conclusions using the GitHub Actions API. The reporter writes a summary and optionally a JSON event file; it **does not send webhooks**.

```yaml
permissions:
  contents: read
  actions: read
steps:
  - uses: actions/checkout@v4
  - name: Checkout shared config
    uses: actions/checkout@v4
    with:
      repository: rodkisten/github
      path: .rod-actions
  - name: Collect console events
    if: always()
    uses: rodkisten/github/actions/console@main
    with:
      defaults: .rod-actions/config/rod-actions.yml
      config: .github/rod-actions.yml
      report: 'true'
      github-token: ${{ github.token }}
      events-file: rod-events.json
```

**Deployment caveat:** The `@main` reference is usable only after the PR is merged and the compiled `dist/console.js` is published. Jobs API results for the currently running job can be incomplete; for authoritative final conclusions use a separate `workflow_run` reporter after completion. Never report uncompleted steps as successful.
