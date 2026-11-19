#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'HELP'
Usage: gh-env-sync --file .env [--type secret|variable] [--scope repo|env] [--environment production] [--limit 10] [--owner USER] [--repo OWNER/NAME ...] [--dry-run] [--yes]
Defaults: secret, repo, 10 most recently pushed non-archived repositories owned by the authenticated user.
HELP
}
file=''; type=''; scope=''; environment=''; limit=10; owner=''; dry_run=false; yes=false
repos=()
while (($#)); do
  case "$1" in
    --file) file=${2:?}; shift 2;;
    --type) type=${2:?}; shift 2;;
    --scope) scope=${2:?}; shift 2;;
    --environment|--env) environment=${2:?}; shift 2;;
    --limit) limit=${2:?}; shift 2;;
    --owner) owner=${2:?}; shift 2;;
    --repo) repos+=("${2:?}"); shift 2;;
    --dry-run) dry_run=true; shift;;
    --yes) yes=true; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2;;
  esac
done
if [[ -t 0 ]] && command -v fzf >/dev/null; then
  pick_one() { printf '%s\n' "$@" | fzf --reverse --height=~10 --border=rounded --color='border:magenta,prompt:cyan'; }
  pick_many() { printf '%s\n' "$@" | fzf --multi --reverse --height=~70% --border=rounded --bind='ctrl-a:select-all' --header='TAB toggle · Ctrl-A select all · Enter confirm' --color='border:magenta,prompt:cyan,pointer:magenta,header:yellow'; }
  [[ -n $type ]] || type=$(pick_one secret variable) || exit 0
  [[ -n $scope ]] || scope=$(pick_one repo env) || exit 0
  if [[ $scope == env && -z $environment ]]; then read -r -p '🌐 Environment: ' environment; fi
else
  type=${type:-secret}; scope=${scope:-repo}
fi
[[ -f "$file" ]] || { echo 'Missing --file or file does not exist' >&2; exit 2; }
[[ $type == secret || $type == variable ]] || { echo 'Invalid --type' >&2; exit 2; }
[[ $scope == repo || $scope == env ]] || { echo 'Invalid --scope' >&2; exit 2; }
[[ $scope != env || -n $environment ]] || { echo 'Environment name required for --scope env' >&2; exit 2; }
[[ $limit =~ ^[1-9][0-9]*$ ]] || { echo 'Invalid --limit' >&2; exit 2; }
for cmd in gh python3; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }; done
gh auth status >/dev/null 2>&1 || { echo 'Run gh auth login first' >&2; exit 1; }

tmp=$(mktemp); chmod 600 "$tmp"; trap 'rm -f "$tmp"' EXIT
python3 - "$file" "$tmp" <<'PY'
import pathlib, re, sys
source = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8-sig')
lines = source.splitlines(keepends=True)
entries = []
i = 0
while i < len(lines):
    line = lines[i].strip()
    i += 1
    if not line or line.startswith('#'):
        continue
    m = re.match(r'(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)', line, re.S)
    if not m:
        raise SystemExit(f'Invalid dotenv assignment at line {i}')
    key, raw = m.groups()
    if raw.startswith(('"', "'")):
        quote = raw[0]
        while not re.search(r'(?<!\\)' + re.escape(quote) + r'\s*(?:#.*)?$', raw):
            if i >= len(lines):
                raise SystemExit(f'Unterminated quoted value: {key}')
            raw += '\n' + lines[i].rstrip('\r\n')
            i += 1
        if quote == '"':
            raw = re.sub(r'\\([nrt\\"])', lambda m: {'n':'\n','r':'\r','t':'\t','\\':'\\','"':'"'}[m[1]], raw[1:raw.rfind('"')])
        else:
            raw = raw[1:raw.rfind("'")]
    else:
        raw = re.split(r'\s+#', raw, maxsplit=1)[0].rstrip()
    if '\x00' in raw:
        raise SystemExit(f'NUL byte not supported: {key}')
    entries.append((key, raw))
if not entries:
    raise SystemExit('No variables found')
with open(sys.argv[2], 'wb') as out:
    for key, value in entries:
        out.write(key.encode() + b'\0' + value.encode() + b'\0')
print(f'Parsed {len(entries)} assignments', file=sys.stderr)
PY

if (("${#repos[@]}" == 0)); then
  owner=${owner:-$(gh api user --jq .login)}
  mapfile -t repos < <(gh api --paginate "users/$owner/repos?per_page=100&type=owner" --jq '.[] | select(.archived == false and .disabled == false) | [.pushed_at, .full_name] | @tsv' | sort -r | head -n "$limit" | cut -f2)
fi
(("${#repos[@]}")) || { echo 'No repositories found' >&2; exit 1; }
if declare -F pick_many >/dev/null; then
  selected=$(pick_many "${repos[@]}") || exit 0
  [[ -n $selected ]] || exit 0
  mapfile -t repos <<< "$selected"
fi
mapfile -d '' -t entries < "$tmp"
keys=(); for ((i=0;i<${#entries[@]};i+=2)); do keys+=("${entries[i]}"); done
if declare -F pick_many >/dev/null; then
  selected=$(pick_many "${keys[@]}") || exit 0
  [[ -n $selected ]] || exit 0
  mapfile -t keys <<< "$selected"
fi
printf '\033[38;5;213m✦ GH ENV STUDIO ✦\033[0m\n'
printf 'Scope: %s %s | Type: %s | Repositories: %s | Keys: %s\n' "$scope" "$environment" "$type" "${#repos[@]}" "${#keys[@]}"
printf 'Keys: %s\n' "${keys[*]}"
printf 'Repositories:\n'; printf '  %s\n' "${repos[@]}"
if [[ $dry_run == true ]]; then echo 'DRY RUN: preview only'; fi
if [[ $yes != true && $dry_run != true ]]; then
  read -r -p 'Apply all changes? Type YES: ' confirmation
  [[ $confirmation == YES ]] || { echo 'Cancelled'; exit 1; }
fi
success=0; failure=0; skipped=0
for repo in "${repos[@]}"; do
  echo "==> $repo"
  if [[ $scope == env && $dry_run != true ]]; then
    if ! gh api -X PUT "repos/$repo/environments/$environment" >/dev/null; then
      echo "  ERROR creating environment" >&2; ((failure+=${#keys[@]})); continue
    fi
  fi
  if [[ $type == variable ]]; then
    args=(variable list --repo "$repo" --json name,value)
    [[ $scope == env ]] && args+=(--env "$environment")
    if ! gh "${args[@]}" > "$tmp.current"; then
      echo "Cannot inspect variables in $repo; skipping" >&2
      ((skipped+=${#keys[@]})); continue
    fi
  fi
  for ((i=0;i<${#entries[@]};i+=2)); do
    key=${entries[i]}; value=${entries[i+1]}
    selected=false
    for chosen in "${keys[@]}"; do [[ $chosen == "$key" ]] && selected=true; done
    [[ $selected == true ]] || continue
    if [[ $type == variable ]]; then
      result=$(python3 - "$tmp.current" "$key" "$value" <<'PY'
import json,sys
items=json.load(open(sys.argv[1]))
old=next((x.get('value','') for x in items if x['name']==sys.argv[2]),None)
new=sys.argv[3]
if old is None: print('NEW')
elif old==new: print('SAME')
else:
 print('CHANGE')
 print('  current: '+repr(old))
 print('  next:    '+repr(new))
PY
)
      state=$(printf '%s\n' "$result" | head -n 1)
      if [[ $state == NEW || $state == SAME ]]; then
        printf '  ⊘ %s: %s (skipped)\n' "$key" "$state"
        ((skipped+=1)); continue
      fi
      printf '\033[38;5;51m↻ %s\033[0m\n%s\n' "$key" "$result"
    fi
    args=("$type" set "$key" --repo "$repo" --body "$value")
    [[ $scope == env ]] && args+=(--env "$environment")
    if [[ $dry_run == true ]]; then
      printf '  ◌ preview %s\n' "$key"
      continue
    fi
    gh "${args[@]}" > "$tmp.output" 2>"$tmp.error" &
    pid=$!; frame=0; frames=('◐' '◓' '◑' '◒')
    if [[ -t 2 ]]; then
      while kill -0 "$pid" 2>/dev/null; do
        printf '\r\033[K\033[38;5;213m%s\033[0m %s · %s' "${frames[frame%4]}" "$repo" "$key" >&2
        frame=$((frame+1)); sleep .12
      done
      printf '\r\033[K' >&2
    fi
    if wait "$pid"; then
      echo "  OK $key"; ((success+=1))
    else
      echo "  FAILED $key" >&2; head -3 "$tmp.error" >&2; ((failure+=1))
    fi
  done
done
printf '\033[38;5;213m✦ Finished:\033[0m %d successful, %d failed, %d skipped\n' "$success" "$failure" "$skipped"
((failure == 0))
\n'*}
      if [[ $state == NEW || $state == SAME ]]; then
        printf '  ⊘ %s: %s (skipped)\n' "$key" "$state"
        ((skipped+=1)); continue
      fi
      printf '\033[38;5;51m↻ %s\033[0m\n%s\n' "$key" "$result"
    fi
    args=("$type" set "$key" --repo "$repo" --body "$value")
    [[ $scope == env ]] && args+=(--env "$environment")
    if gh "${args[@]}" >/dev/null; then
      echo "  OK $key"; ((success+=1))
    else
      echo "  FAILED $key" >&2; ((failure+=1))
    fi
  done
done
printf 'Completed: %d successful, %d failed\n' "$success" "$failure"
((failure == 0))
