# Shared CI architecture

Source: https://chatgpt.com/share/6afec44b-5bf8-83ea-83d0-ae099d383b94?ogimg=plain

## Principles

- Keep a lightweight caller workflow in each repository; GitHub event triggers cannot be centralized entirely.
- Put reusable jobs in .github/workflows and composite step actions in actions/.
- Store repository-specific glob rules in config/paths.yml. Validate patterns against actual trees before enabling.
- Use dorny/paths-filter for changed-file detection, after loading the selected repository's rules.
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
- [ ] Add central filter workflow with schema validation and dynamic extraction.
- [ ] Inventory every active repository and workflow, including required checks and deploy triggers.
- [ ] Validate actual file paths, dry-run filters and publish a summary.
- [ ] Migrate one repository at a time; verify checks before deleting old workflows.
- [ ] Consolidate duplicate lockfile repair, formatting, build and notification workflows.
- [ ] Add automated regression coverage for shared runtime utilities and policy parser.

## Guardrails

Do not delete existing workflows until the replacement has completed successfully on PR and push. Preserve manual workflow_dispatch for operational deployments where needed. Do not run deployment from untrusted fork PRs. Cross-repository changes require individual reviews.
