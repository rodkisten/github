# Source this file from ~/.zshrc after setting BOT_APP_ID and BOT_PRIVATE_KEY_FILE.
# Configure ROD_GITHUB_REPO_DIR to the local checkout of rodkisten/github.
rod-gh-token() {
  emulate -L zsh
  local root="${ROD_GITHUB_REPO_DIR:-$HOME/github}"
  command node "$root/scripts/rod-gh-token.mjs" "$@"
}
rod-gh() {
  emulate -L zsh
  local token
  token="$(rod-gh-token)" || return
  GH_TOKEN="$token" GITHUB_TOKEN="$token" command gh "$@"
}
rod-git-push() {
  emulate -L zsh
  local token
  token="$(rod-gh-token)" || return
  # GitHub CLI supplies temporary Git credentials without storing the token in .git/config.
  GH_TOKEN="$token" GITHUB_TOKEN="$token" command gh auth setup-git || return
  GH_TOKEN="$token" GITHUB_TOKEN="$token" command git push "$@"
}
