# Ecosystem-wide shared Actions migration

Priority: migrate every active project to shared CI/CD infrastructure before further bundle optimization.

## Inventory (2026-11-24)

| Repository | Workflow files | Status |
|---|---:|---|
| shell | 12 | Integration PR #27 |
| userscripts-cf | 18 | Audit pending |
| photointel | 51 | Audit pending |
| orb | 3 | Audit pending |
| jardim | 4 | Audit pending |
| ast-explorer | 5 | Audit pending |
| eita | 2 | Audit pending |
| rodtui | 2 | Audit pending |
| rodkisten.github.io | 3 | Audit pending |
| EJC | unknown | Resolve repository/workflow directory |
| Manage | unknown | Resolve repository/workflow directory |
| Rodlog | unknown | Resolve repository/workflow directory |

Inventory counts are directory entries, not proof of active workflows. Discover additional active repositories before declaring completion.

## Migration contract

- Inventory triggers, permissions, environments, secrets, concurrency, outputs, artifacts, dependencies and deployment targets.
- Prefer reusable workflows for complete jobs and composite actions for shared steps. Preserve project-specific build commands and cloud resources.
- Pin published shared revisions; never reference unbuilt TypeScript action revisions.
- Preserve App authentication and least privilege. Do not expose deployment credentials to untrusted fork PRs.
- Preserve preview verification, stable URLs, notifications and baseline provenance.
- Keep one migration PR per consumer, reuse an existing suitable PR, synchronize with main before changes.
- Validate equivalent CI and deployment behavior before removing legacy workflows. Never delete a workflow merely because its name appears obsolete.
- Track every workflow as migrated, intentionally project-specific, obsolete with evidence, or blocked.
- Record commit, PR, run, and rollback reference for each consumer.

## Execution order

1. Shell: finish validating existing integration.
2. Jardim, orb, Eita, AST Explorer, RodTUI: audit and migrate smaller workflows, including Rust-specific needs.
3. Userscripts: consolidate build, preview, reports, release and maintenance.
4. PhotoIntel: migrate in functional groups, preserve cloud-specific contracts.
5. GitHub.io and remaining active repositories: discover and migrate.
6. Final coverage audit, remove verified redundant implementations and document exceptions.

No consumer is considered complete until its workflows have been inspected and migration verified.
