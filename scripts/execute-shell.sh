#!/usr/bin/env bash
set -euo pipefail
token="$ROD_EXEC_TOKEN"
unset ROD_EXEC_TOKEN
case "$LANGUAGE" in bash|javascript) ;; *) echo "Invalid language" >&2; exit 1;; esac
case "$INSTALL" in auto|true|false) ;; *) echo "Invalid install mode" >&2; exit 1;; esac
if [[ "$PM" == yarn ]]; then
  npm install --global corepack
  corepack enable yarn
  if [[ -n "$PM_VERSION" ]]; then corepack prepare "yarn@$PM_VERSION" --activate; fi
elif [[ "$PM" == npm && -n "$PM_VERSION" ]]; then
  npm install --global "npm@$PM_VERSION"
fi
if [[ "$INSTALL" != false && "$PM" != none ]]; then
  args=()
  case "$PM" in
    npm) if [[ -n "$LOCKFILE" ]]; then args=(ci); else args=(install); fi ;;
    pnpm|bun) args=(install); if [[ -n "$LOCKFILE" ]]; then args+=(--frozen-lockfile); fi ;;
    yarn) args=(install); if [[ -n "$LOCKFILE" ]]; then
      version="$(yarn --version)"
      if [[ "$version" == 1.* ]]; then args+=(--frozen-lockfile); else args+=(--immutable); fi
    fi ;;
  esac
  while IFS= read -r arg; do [[ -z "$arg" ]] || args+=("$arg"); done <<< "$INSTALL_ARGS"
  "$PM" "${args[@]}"
fi
if [[ "$LANGUAGE" == javascript ]]; then
  ROD_EXEC_TOKEN="$token" node "$ACTION_ROOT/../../dist/execute-js.js"
elif [[ -n "$FILE" ]]; then bash -e -o pipefail -- "$FILE"; else bash -e -o pipefail -c "$SCRIPT"; fi
