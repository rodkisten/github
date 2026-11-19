#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'HELP'
Usage: gh-env-sync --file .env [--type secret|variable] [--scope repo|env] [--environment production] [--limit 10] [--owner USER] [--repo OWNER/NAME ...] [--dry-run] [--yes]
Defaults: secret, repo, 10 most recently pushed non-archived repositories owned by the authenticated user.
HELP
}
file=''; type=secret; scope=repo; environment=''; limit=10; owner=''; dry_run=false; yes=false
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
mapfile -d '' -t entries < "$tmp"
keys=(); for ((i=0;i<${#entries[@]};i+=2)); do keys+=("${entries[i]}"); done
printf 'Scope: %s %s | Type: %s | Repositories: %s | Keys: %s\n' "$scope" "$environment" "$type" "${#repos[@]}" "${#keys[@]}"
printf 'Keys: %s\n' "${keys[*]}"
printf 'Repositories:\n'; printf '  %s\n' "${repos[@]}"
if [[ $dry_run == true ]]; then echo 'DRY RUN: no changes made'; exit 0; fi
if [[ $yes != true ]]; then
  read -r -p 'Apply all changes? Type YES: ' confirmation
  [[ $confirmation == YES ]] || { echo 'Cancelled'; exit 1; }
fi
success=0; failure=0
for repo in "${repos[@]}"; do
  echo "==> $repo"
  if [[ $scope == env ]]; then
    if ! gh api -X PUT "repos/$repo/environments/$environment" >/dev/null; then
      echo "  ERROR creating environment" >&2; ((failure+=${#keys[@]})); continue
    fi
  fi
  for ((i=0;i<${#entries[@]};i+=2)); do
    key=${entries[i]}; value=${entries[i+1]}
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
