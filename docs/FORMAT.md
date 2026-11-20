# 🎨 Rod Universal Format

A separate `actions/format` Node 24 action, usable from the Rod Console workflow.

## Languages

Prettier: JS, JSX, TS, TSX, JSON, YAML, CSS, SCSS, HTML, Vue, Markdown, GraphQL, Svelte, Astro. Optional ESLint for JS/TS.
Native: `gofmt` (Go), `rustfmt` (Rust), `ruff format` (Python), `shfmt` (shell).

The action only uses tools already installed in the caller's runner. Missing tools are reported as skipped. It does not install packages, push commits, or post PR comments by itself.

## Example

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- run: npm ci
- uses: rodkisten/github/actions/format@main
  id: format
  with:
    mode: fix
    scope: changed
    base: origin/main
    lint: 'true'
```

Use the separate PR workflow for GitHub App commits and sticky comments. `check` reports problems without modifying files; `fix` changes files in the working tree. `all` uses tracked files. `changed` uses the merge-base with the configured ref.

Security: run fixes only on trusted branches, not untrusted fork PRs with privileged tokens.

## Shell dialects

- Bash (`.bash`, `.bashrc`, `.bash_profile`, Bash shebang): `shfmt -ln bash`, `shellcheck -s bash`, `bash -n`.
- POSIX shell (`.sh`, `sh`/`dash` shebang): `shfmt -ln posix`, `shellcheck -s sh`, `sh -n`.
- Zsh (`.zsh`, `.zshrc`, `.zprofile`, Zsh shebang): `zsh -n` syntax check. **Zsh autoformat is not implemented**: shfmt and ShellCheck are not Zsh parsers, so passing Zsh code to them would be unsafe. Add a Zsh-compatible formatter before enabling automatic rewrites.

Tool invocations use shared TypeScript `execute()` utility. Missing tools are reported as skipped, not treated as success; CI should explicitly enforce a strict policy before merge.
