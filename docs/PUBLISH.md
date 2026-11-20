# Publish action

Publish the current workspace changes either directly to a branch or as a pull request. The action uses the GitHub Git Database API, so it does not need to rewrite the caller's checkout or run shell-based git commits.

## Permissions

```yaml
permissions:
  contents: write
  pull-requests: write # only required for mode: pull-request
```

Use a GitHub App installation token when commits must trigger downstream workflows. Pass the token through `token`; never put credentials in `template-data`.

## Direct commit

```yaml
- uses: rodkisten/github/actions/publish@main
  id: publish
  with:
    token: ${{ steps.app-token.outputs.token }}
    mode: commit
    branch: main
    commit-message-template: 'chore(${{ github.event.repository.name }}): refresh {{fileCount}} generated files'
```

## Pull request

```yaml
- uses: rodkisten/github/actions/publish@main
  id: publish
  with:
    token: ${{ steps.app-token.outputs.token }}
    mode: pull-request
    branch: automation/update-generated-assets
    base-branch: main
    pr-title-template: 'chore({{repo}}): update generated assets'
    pr-body-template: |
      ## Summary
      Updated {{fileCount}} files in {{repository}}.

      - Source: [workflow run]({{runUrl}})
      - Commit: `{{shortSha}}`

      {{#each files}}
      - `{{this}}`
      {{/each}}
    labels: automation,generated
```

An open PR with the same head and base is updated instead of duplicated. Existing PR branch history is preserved by creating the new commit on top of its current head. The draft flag is applied when creating a PR; updating an existing PR preserves its current draft/ready state.

## Template variables

| Variable | Description |
| --- | --- |
| `repository`, `owner`, `repo` | Repository identity |
| `branch`, `baseBranch` | Target and PR base branches |
| `sha`, `shortSha` | Workflow source commit |
| `actor`, `workflow`, `eventName` | GitHub execution identity |
| `runId`, `runNumber`, `runUrl` | Workflow run metadata |
| `ref`, `refName`, `prNumber` | Git reference and source PR |
| `timestamp` | ISO timestamp |
| `files`, `fileCount` | Files included in this publish operation |
| `inputs` | Workflow dispatch inputs, when available |
| `template-data` | User-supplied JSON fields, merged at the top level |

Handlebars supports nested properties, `if`, `unless`, `each`, `with`, and registered helpers: `upper`, `lower`, `json`, `default`, `eq`, and `date`. Templates are strict: unknown variables fail instead of silently producing incomplete commit messages or PR descriptions. Use triple braces only when raw output is intentionally required.

## Outputs

- `commit-sha`
- `branch`
- `pr-number`
- `pr-url`
- `files`
