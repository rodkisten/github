# Shared CI architecture

Source: https://chatgpt.com/share/6afec44b-5bf8-83ea-83d0-ae099d383b94?ogimg=plain

## Principles

- Keep a lightweight caller workflow in each repository; GitHub event triggers cannot be centralized entirely.
- Put reusable jobs in .github/workflows and composite step actions in actions/.
- Store repository-specific glob rules in config/paths.yml. Validate patterns against actual trees before enabling.
- Use the first-party Node 24 TypeScript `actions/paths-filter` action for changed-file detection and centralized YAML rules; no Python/PyYAML/dorny dependency.
- For PRs, grant pull-requests: read to the filter job. For pushes, use checkout with sufficient history/base ref.
- A workflow cannot use a remotely fetched YAML file directly as a static `on.push.paths` trigger. The gate runs first and dispatches jobs conditionally.
- Always retain a stable successful required check, even when expensive jobs are skipped.
- Never skip security checks or protected branch policies solely because a commit has a skip marker.
- Keep bot skipping opt-in: bots can change important code.
- Use GitHub App tokens with least privilege and avoid printing tokens.
- Use immutable commit SHAs or reviewed release tags for reusable dependencies in production.

## Migration checklist

- [x] Initialize shared repository.
- [x] Define initial per-repository glob rules (provisional, not audited).
- [x] Add app-token and skip-ci composite actions.
- [x] Migrate the central filter workflow to the first-party TypeScript action and configurable YAML source.\n- [ ] Add schema validation and dry-run coverage for all repository filters.\n- [x] Add reusable filtered CI matrix with one parallel job per matched filter and safe no-match handling.
- [ ] Inventory every active repository and workflow, including required checks and deploy triggers.
- [ ] Validate actual file paths, dry-run filters and publish a summary.
- [ ] Migrate one repository at a time; verify checks before deleting old workflows.
- [ ] Consolidate duplicate lockfile repair, formatting, build and notification workflows.
- [ ] Add automated regression coverage for shared runtime utilities and policy parser.

## Guardrails

Do not delete existing workflows until the replacement has completed successfully on PR and push. Preserve manual workflow_dispatch for operational deployments where needed. Do not run deployment from untrusted fork PRs. Cross-repository changes require individual reviews.

## Reusable TypeScript paths filter

Call `rodkisten/github/.github/workflows/paths-filter.yml@v1` from a caller workflow. The caller controls event triggers, while the reusable job evaluates changed files using the Node 24 action and `config/paths.yml`.

```yaml
jobs:
  paths:
    uses: rodkisten/github/.github/workflows/paths-filter.yml@v1
    permissions:
      contents: read
      pull-requests: read
    with:
      repository-key: userscripts-cf
      config-repository: rodkisten/github
      config-ref: main
      config-path: config/paths.yml
  build:
    needs: paths
    if: needs.paths.outputs.any == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo 'Changed filters: ${{ needs.paths.outputs.changes }}'
```

The default configuration source is `rodkisten/github:main:config/paths.yml`. Override the source with `config-repository`, `config-ref` and `config-path`, or extend the shared configuration by adding repository-specific filters under `repositories.<key>.filters`. Defaults are inherited from `defaults.filters`, and a repository-specific filter of the same name overrides that default. `base` can override the push comparison base. Outputs: `changes` (JSON array), `files` (JSON array) and `any` (boolean string). The caller's token must be able to read the configuration repository and pull-request files.\n\nFor a dynamic build matrix, call `filtered-ci.yml@v1`. It creates one parallel job per matched filter and passes the filter name to child commands as `ROD_CI_FILTER`. When no filters match, it emits a successful explanatory job and avoids an empty matrix.

> Release sequencing: merge this change, publish a new `v1` bundle, then migrate consumer repositories. The reusable workflow references the published `@v1` action, not an unbundled TypeScript source file. Never assume an unreleased input exists in an older tag.
