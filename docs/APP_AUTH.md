# 🤖 Rod GitHub App authentication

Use the same GitHub App identity in GitHub Actions and on your own machine. The private key is long-lived; installation tokens are short-lived (normally one hour) and generated on demand. Never commit or print the private key or token in logs.

## Local Zsh setup

Requirements: Node.js 24+, GitHub CLI, a GitHub App installed on the target owner/repository, and its private key on disk.

```zsh
export BOT_APP_ID='YOUR_APP_ID'
export BOT_PRIVATE_KEY_FILE="$HOME/.config/rod/secrets/github-app.pem"
export BOT_OWNER='rodkisten'
export BOT_REPOSITORY='github' # optional: restrict token to one installed repository
export BOT_PERMISSIONS='contents:write,actions:write' # optional: only permissions granted to the App
export ROD_GITHUB_REPO_DIR="$HOME/github" # point to your local checkout
source "$ROD_GITHUB_REPO_DIR/scripts/rod-gh.zsh"

rod-gh api user
rod-gh workflow run validate.yml -R rodkisten/github --ref main
rod-gh run list -R rodkisten/github --limit 5
rod-git-push origin main
```

**Important:** `rod-gh api user` is not a valid verification for installation tokens, which authenticate as an installation rather than a user. Verify with `rod-gh api repos/rodkisten/github --jq .full_name` instead.

If the app is installed on a personal account, `BOT_OWNER` is the personal username; if it is installed on an organization, it is the organization name. `BOT_INSTALLATION_ID` can be supplied explicitly to avoid installation discovery.

Keep `BOT_PERMISSIONS` narrow: `contents:write` for pushes; `actions:write` for workflow dispatch; `pull_requests:write` for PR mutations. The App installation must have those permissions granted.

The wrapper obtains a fresh token per command, never writes it to the repository, and does not alter your default `gh auth` identity. For Git push, `rod-git-push` configures GitHub CLI's credential helper and passes the token only to the push process.

## GitHub Actions

For workflows, use the official `actions/create-github-app-token@v2` action already in this repository, with `BOT_APP_ID` and `BOT_PRIVATE_KEY` stored in GitHub Secrets. Pass `steps.app-token.outputs.token` to checkout, `GH_TOKEN`, or APIs. Grant only the permissions required for each job. Never use a non-expiring PAT as a substitute.

The local CLI is intentionally independent of the repository's compiled `src/app-token` action, so it can bootstrap authentication even when the JavaScript bundles have not been published.
