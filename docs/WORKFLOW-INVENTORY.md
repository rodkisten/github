# 🗂️ Workflow inventory and consolidation plan

Source conversation: https://chatgpt.com/share/6afec44b-5bf8-83ea-83d0-ae099d383b94?ogimg=plain

## 🧭 Table of contents

- [📊 Snapshot](#-snapshot)
- [🧩 userscripts-cf](#-userscripts-cf)
- [📸 photointel](#-photointel)
- [🐚 shell](#-shell)
- [📦 roteador](#-roteador)
- [🛡️ Consolidation rules](#️-consolidation-rules)
- [🚦 Migration order](#-migration-order)

## 📊 Snapshot

Inventory captured from the default branches on 2026-11-19. Counts include all files in `.github/workflows`, including manual maintenance and deployment workflows. A high count is not itself proof of redundancy.

| Repository | Workflow files | Initial assessment |
|---|---:|---|
| `userscripts-cf` | 17 | Many maintenance/migration workflows; inspect shared CI, formatting and lockfile responsibilities |
| `photointel` | 46 | Large workflow surface; preserve deployment, infra, GPU, media and terminal operations |
| `shell` | 6 | Small surface; build/lint validation is a good first reusable-workflow candidate |
| `roteador` | 4 | CI, publish and promotion are distinct; consolidate validation only |

## 🧩 userscripts-cf

Workflows observed:

`audit-fallow`, `collect-check-annotations`, `diagnostics`, `import-zips`, `playground-pages`, `ploocky-publish-preview`, `prettier-full`, `publish-releases`, `react-ast-codemod`, `react-foundation`, `react-migration-validation`, `release`, `repair-lockfile`, `rod-ast`, `sync-form-controls`, `test`, `typescript-safe-autofix`.

### Candidates to consolidate, not delete yet

- `test.yml`: design-system and workflow-auth policy checks; retain those unique checks. It explicitly delegates build/tests to `diagnostics.yml` and lockfile writes to `repair-lockfile.yml`.
- `diagnostics.yml`: candidate owner for affected-user-script test/build validation after central path filtering is proven.
- `prettier-full.yml`: keep as a manual formatter, but replace duplicated App token/PR/commit mechanics with shared actions.
- `repair-lockfile.yml`: keep its manual repair capability; replace authentication and Git commit plumbing with shared actions.
- `collect-check-annotations.yml`: keep if it only aggregates diagnostics; do not fold it into ordinary build jobs.

### Preserve

Release, preview, import, AST codemod, migration and form-control sync workflows have separate operational purposes. Do not remove based on name similarity.

## 📸 photointel

Observed 46 workflow files. Main CI and lockfile candidates:

- `ci.yml`: already has a detailed internal Python/frontend path router and selective job execution. This is the first target for a careful comparison with central filters, not a blind replacement.
- `npm-lockfiles.yml`: handles multiple npm manifests and PR branch updates. Compare with the repo's other lockfile repair workflows before consolidating.
- `temp-terminal-lockfile.yml`: explicitly temporary and branch-scoped. Candidate for removal only after confirming its branch/work is finished and its responsibility is covered by `npm-lockfiles.yml`.
- `ci-pretty-logs.yml`: likely presentation/helper workflow; inspect callers before deciding whether it is redundant.
- `backend-smoke.yml`, `media-ci.yml`, `media-smoke.yml`, `webkit-validation.yml`, `real-cpu-smoke.yml`: preserve specialized validation until their unique test matrices are mapped into reusable jobs.

Deployment, infrastructure, GPU/Modal, GCP, Cloudflare preview, SSH/terminal, iCloud, media publishing and artifact-cleanup workflows are operational workflows. They are not generic CI duplicates and must remain separate unless an explicit shared deploy primitive is introduced.

## 🐚 shell

Observed workflows: `check.yml`, `cloudflare-preview.yml`, `deploy-shell.yml`, `linux-v86-assets.yml`, `shell-flow-wasm.yml`, `zsh-migration.yml`.

- `check.yml` is a clean candidate for the shared Node CI runner and centralized path filter.
- Preview/deploy, Linux v86 asset generation, WASM and migration workflows have distinct responsibilities; preserve them.

## 📦 roteador

Observed workflows: `auto-fix.yml`, `ci.yml`, `promote.yml`, `publish.yml`.

- `ci.yml` is a clean candidate for shared Node CI and paths filtering.
- Keep `publish.yml` and `promote.yml` separate because publishing and promotion are release lifecycle operations.
- Keep `auto-fix.yml` separate until its trigger, permissions and write behavior are reviewed.

## 🛡️ Consolidation rules

1. Never delete a workflow solely because its name looks similar to another.
2. Preserve every `workflow_dispatch`, schedule, deployment environment, concurrency policy and release gate unless intentionally migrated.
3. Preserve security, design-system, migration and specialized test coverage.
4. Replace bot authentication, PR creation/update, multi-file commit and skip-CI mechanics with the shared TypeScript actions.
5. Keep a stable required-check job even when the filtered matrix has no matching paths.
6. Use the central `config/paths.yml` as the only source of path-to-scope rules; avoid duplicate inline glob lists.
7. Migrate one repository at a time. Run old and new checks in parallel for at least one successful PR and main push before removing old validation.
8. Require green CI and an explicit workflow inventory update before deleting any workflow.

## 🚦 Migration order

- [x] Capture workflow inventory and classify obvious operational workflows.
- [ ] Complete path mappings against real repository trees and package manifests.
- [ ] Migrate `shell/check.yml` to shared filtered CI as the low-risk pilot.
- [ ] Migrate `roteador/ci.yml` after the pilot proves stable.
- [ ] Compare `userscripts-cf/diagnostics.yml` and `test.yml`; preserve unique design-system/auth checks.
- [ ] Consolidate userscripts lockfile and formatter GitHub App operations.
- [ ] Refactor `photointel/ci.yml` into central path routing while preserving its specialized job graph.
- [ ] Remove `photointel/temp-terminal-lockfile.yml` only after its temporary branch task is confirmed complete.
- [ ] Re-audit all workflows and update this inventory after each migration.

> 🧯 Status: inventory only. No workflow files in consumer repositories were deleted or modified during this audit.
