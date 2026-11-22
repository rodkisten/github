# 🧩 Rod Actions Console — Reusable All-in-One Workflow

Workflow reutilizável completo em `.github/workflows/console.yml` que orquestra todo o ciclo de CI/CD, formatação, releases e telemetria usando os handlers TypeScript/Node 24 unificados.

## 🚀 Uso rápido nos repositórios consumidores

```yaml
name: 🧩 Rod Console
on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pull-requests: read
  issues: write
  actions: read

jobs:
  console:
    uses: rodkisten/github/.github/workflows/console.yml@main
    with:
      repository-key: userscripts-cf
      format-mode: ${{ github.event_name == 'pull_request' && 'fix' || 'check' }}
      release-mode: ${{ github.ref == 'refs/heads/main' && 'auto' || 'off' }}
    secrets:
      BOT_APP_ID: ${{ secrets.BOT_APP_ID }}
      BOT_PRIVATE_KEY: ${{ secrets.BOT_PRIVATE_KEY }}
```

## 🔄 Pipeline executado

1. **`gate` (`skip-ci` + `console`)**: Avalia marcadores `[skip ci]` / atores bot e resolve `config/rod-actions.yml` mesclado com `.github/rod-actions.yml`.
2. **`format` (`console` + `app-token` + `commit` + `format-report`)**: Formata/linta arquivos alterados ou o repositório todo, cria commit atômico via GitHub App em PRs confiáveis (quando `format-mode: fix`) e mantém comentário sticky atualizado no PR.
3. **`paths` (`paths-filter`)**: Avalia regras centralizadas em `config/paths.yml` com expansão transitiva de `depends-on`.
4. **`ci` (`setup-node` + `setup-rodlog` + `node-ci` + `ci-summary`)**: Executa matriz paralela por escopo afetado com diagnósticos estruturados via `rodlog` e expõe `ROD_CI_FILTER`.
5. **`release` (`hybrid-release.yml`)**: Publica release SemVer (`auto`, `major`, `minor`, `patch` ou `exact`) via GitHub App quando aplicável.
6. **`console-report` (`console`)**: Coleta eventos de conclusão de jobs/steps (`step.failure`, `job.completed`) com chaves de deduplicação e atua como **gate final estável** para branch protection.
