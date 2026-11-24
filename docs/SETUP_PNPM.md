# Shared pnpm setup

Use `rodkisten/github/src/setup-pnpm@<published-sha>` after checkout.

```yaml
- uses: rodkisten/github/src/setup-pnpm@<published-sha>
  with:
    node-version: '24'
    working-directory: .
```

The default uses the workspace packageManager field, caches the pnpm store and installs with --frozen-lockfile. Specify pnpm-version only when necessary and consistent with packageManager. Set install: 'false' for lockfile maintenance, cache: 'false' when no lockfile exists, and ignore-scripts: 'true' when lifecycle scripts must not run. The working directory must be the workspace root. No automatic lockfile repair is performed.
