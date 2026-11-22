#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# CONSTANTS
# ============================================================================

readonly SRC_DIR="src"
readonly LEGACY_ACTIONS_DIR="actions"
readonly LEGACY_YML_NAME="action.yml"
readonly CLI_APPLY_FLAG="--apply"

readonly C_RESET=$'\033[0m'
readonly C_BOLD=$'\033[1m'
readonly C_DIM=$'\033[2m'
readonly C_RED=$'\033[31m'
readonly C_GREEN=$'\033[32m'
readonly C_YELLOW=$'\033[33m'
readonly C_CYAN=$'\033[36m'

# ============================================================================
# LOGGER
# ============================================================================

log_header() {
  printf "\n%s%s=== %s ===%s\n" "$C_BOLD" "$C_CYAN" "$1" "$C_RESET"
}

log_info() {
  printf "%s[INFO]%s %s\n" "$C_CYAN" "$C_RESET" "$1"
}

log_ok() {
  printf "%s[OK]%s   %s\n" "$C_GREEN" "$C_RESET" "$1"
}

log_warn() {
  printf "%s[WARN]%s %s\n" "$C_YELLOW" "$C_RESET" "$1"
}

log_conflict() {
  local action="$1"
  local reason="$2"
  local details="$3"
  printf "%s[CONFLICT]%s %s%s%s (%s): %s\n" \
    "$C_RED" "$C_RESET" "$C_BOLD" "$action" "$C_RESET" "$reason" "$details" >&2
}

log_step() {
  local idx="$1"
  local total="$2"
  local msg="$3"
  printf "%s[%02d/%02d]%s %s\n" "$C_DIM" "$idx" "$total" "$C_RESET" "$msg"
}

# ============================================================================
# HELPERS (POSIX / PORTABLE MACOS & LINUX)
# ============================================================================

# Substituição literal/regex segura usando perl (evita divergência sed GNU vs BSD)
replace_in_file_perl() {
  local file="$1"
  local perl_expr="$2"
  perl -0777 -i -pe "$perl_expr" "$file"
}

count_matches_perl() {
  local file="$1"
  local perl_expr="$2"
  perl -0777 -ne "my \$c = () = ($perl_expr); print \$c;" "$file"
}

# Calcula caminho relativo POSIX de um diretório origem para um arquivo destino
relative_path_from_dir() {
  local from_dir="$1"
  local to_path="$2"

  perl -MFile::Spec -e '
    my ($from, $to) = @ARGV;
    my $rel = File::Spec->abs2rel($to, $from);
    $rel = "./$rel" unless $rel =~ m{^\.};
    print $rel;
  ' "$from_dir" "$to_path"
}

# ============================================================================
# MAIN
# ============================================================================

main() {
  local apply_mode=0
  for arg in "$@"; do
    if [[ "$arg" == "$CLI_APPLY_FLAG" ]]; then
      apply_mode=1
    fi
  done

  if ! command -v perl >/dev/null 2>&1; then
    printf "%s[FATAL]%s 'perl' é necessário para substituições portáveis.\n" "$C_RED" "$C_RESET" >&2
    exit 1
  fi

  if [[ "$apply_mode" -eq 1 ]]; then
    log_header "MODO DE EXECUÇÃO REAL (--apply)"
  else
    log_header "MODO SIMULAÇÃO (DRY-RUN)"
  fi

  if [[ ! -d "$LEGACY_ACTIONS_DIR" ]]; then
    printf "%s[FATAL]%s Diretório legado não encontrado: %s/\n" "$C_RED" "$C_RESET" "$LEGACY_ACTIONS_DIR" >&2
    exit 1
  fi

  if [[ ! -d "$SRC_DIR" ]]; then
    printf "%s[FATAL]%s Diretório src não encontrado: %s/\n" "$C_RED" "$C_RESET" "$SRC_DIR" >&2
    exit 1
  fi

  # --------------------------------------------------------------------------
  # FASE 1: DESCOBERTA E DETECÇÃO DE CONFLITOS
  # --------------------------------------------------------------------------
  declare -a valid_actions=()
  local conflict_count=0

  for legacy_dir in "$LEGACY_ACTIONS_DIR"/*; do
    [[ -e "$legacy_dir" ]] || continue
    [[ -d "$legacy_dir" ]] || continue

    local action_name
    action_name="$(basename "$legacy_dir")"
    local legacy_yml="$legacy_dir/$LEGACY_YML_NAME"
    local target_dir="$SRC_DIR/$action_name"
    local target_yml="$target_dir/$action_name.yml"

    if [[ ! -f "$legacy_yml" ]]; then
      log_conflict "$action_name" "LEGACY_YML_MISSING" "Arquivo esperado não existe: $legacy_yml"
      conflict_count=$((conflict_count + 1))
      continue
    fi

    if [[ ! -d "$target_dir" ]]; then
      log_conflict "$action_name" "SRC_ACTION_DIR_MISSING" "Pasta correspondente em src não existe: $target_dir"
      conflict_count=$((conflict_count + 1))
      continue
    fi

    if [[ -e "$target_yml" ]]; then
      log_conflict "$action_name" "TARGET_YML_ALREADY_EXISTS" "Conflito de destino: $target_yml já existe"
      conflict_count=$((conflict_count + 1))
      continue
    fi

    if ! grep -qE '^runs:' "$legacy_yml"; then
      log_conflict "$action_name" "INVALID_YAML_STRUCTURE" "$legacy_yml não possui a chave raiz 'runs:'"
      conflict_count=$((conflict_count + 1))
      continue
    fi

    # Verifica arquivos extras inesperados dentro de actions/<action-name>/
    local extra_files=()
    for item in "$legacy_dir"/*; do
      [[ -e "$item" ]] || continue
      if [[ "$(basename "$item")" != "$LEGACY_YML_NAME" ]]; then
        extra_files+=("$(basename "$item")")
      fi
    done

    if [[ "${#extra_files[@]}" -gt 0 ]]; then
      log_warn "A pasta $legacy_dir contém arquivos extras (${extra_files[*]}). Serão removidos com a pasta se aplicar."
    fi

    valid_actions+=("$action_name")
  done

  local total_actions="${#valid_actions[@]}"
  log_info "Actions válidas detectadas: $total_actions"

  local idx=0
  for action_name in "${valid_actions[@]}"; do
    idx=$((idx + 1))
    log_step "$idx" "$total_actions" \
      "$LEGACY_ACTIONS_DIR/$action_name/$LEGACY_YML_NAME -> $SRC_DIR/$action_name/$action_name.yml"
  done

  # --------------------------------------------------------------------------
  # FASE 2: VARREDURA DE IMPORTS E REFERÊNCIAS (TS, YML, TSDOWN)
  # --------------------------------------------------------------------------
  log_header "ANALISANDO REFERÊNCIAS (TS, YML, TSDOWN)"

  declare -a files_to_update=()
  declare -a file_categories=()
  declare -a file_hit_counts=()

  # Coleta arquivos relevantes ignorando node_modules, .git, dist, build
  while IFS= read -r -d '' file; do
    # Remove './' inicial gerado pelo find
    file="${file#./}"

    # Ignora os próprios action.yml que serão movidos
    local is_legacy_yml=0
    for action_name in "${valid_actions[@]}"; do
      if [[ "$file" == "$LEGACY_ACTIONS_DIR/$action_name/$LEGACY_YML_NAME" ]]; then
        is_legacy_yml=1
        break
      fi
    done
    [[ "$is_legacy_yml" -eq 1 ]] && continue

    local total_hits=0
    local category=""

    case "$file" in
      tsdown.config.ts|tsdown.config.mts|tsdown.config.js|tsdown.config.mjs)
        category="TSDOWN_CONFIG"
        for action_name in "${valid_actions[@]}"; do
          local hits
          hits="$(count_matches_perl "$file" "m{['\"](?:\./)?actions/\Q$action_name\E(?:/index\.ts)?['\"]}g")"
          total_hits=$((total_hits + hits))
        done
        ;;
      *.ts|*.tsx|*.mts|*.cts)
        category="TS_IMPORT"
        for action_name in "${valid_actions[@]}"; do
          local hits
          hits="$(count_matches_perl "$file" "m{(?:import|export|require)\s*[\s\S]*?['\"][^'\"]*?actions/\Q$action_name\E(?:/[^'\"]*)?['\"]}g")"
          total_hits=$((total_hits + hits))
        done
        ;;
      *.yml|*.yaml)
        category="YML_REF"
        for action_name in "${valid_actions[@]}"; do
          local hits
          hits="$(count_matches_perl "$file" "m{(?:\./)?actions/\Q$action_name\E(?:/action\.yml)?(?![\w\-./])}g")"
          total_hits=$((total_hits + hits))
        done
        ;;
    esac

    if [[ "$total_hits" -gt 0 ]]; then
      files_to_update+=("$file")
      file_categories+=("$category")
      file_hit_counts+=("$total_hits")
    fi
  done < <(
    find . \
      \( -name node_modules -o -name .git -o -name dist -o -name build -o -name .next \) -prune \
      -o -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.mts" -o -name "*.cts" -o -name "*.yml" -o -name "*.yaml" -o -name "tsdown.config.*" \) -print0
  )

  local total_files="${#files_to_update[@]}"
  if [[ "$total_files" -gt 0 ]]; then
    for ((i = 0; i < total_files; i++)); do
      log_step "$((i + 1))" "$total_files" \
        "[${file_categories[$i]}] ${files_to_update[$i]} (${file_hit_counts[$i]} ocorrência(s))"
    done
  else
    log_info "Nenhuma referência externa em TS/YML/tsdown precisará de replace."
  fi

  # --------------------------------------------------------------------------
  # FASE 3: GATE DE SEGURANÇA
  # --------------------------------------------------------------------------
  if [[ "$conflict_count" -gt 0 ]]; then
    log_header "CONFLITOS DETECTADOS ($conflict_count)"
    log_warn "Migração BLOQUEADA por conflitos. Resolva os erros acima antes de rodar com $CLI_APPLY_FLAG."
    exit 1
  fi

  if [[ "$total_actions" -eq 0 ]]; then
    log_warn "Nenhuma action encontrada em $LEGACY_ACTIONS_DIR/ para migrar."
    exit 0
  fi

  printf "\n"
  log_ok "Verificação de segurança concluída: NENHUM CONFLITO encontrado."

  if [[ "$apply_mode" -eq 0 ]]; then
    log_info "Nenhuma alteração foi feita no disco. Rode novamente com ${C_BOLD}${CLI_APPLY_FLAG}${C_RESET} para aplicar."
    exit 0
  fi

  # --------------------------------------------------------------------------
  # FASE 4: EXECUÇÃO REAL (--apply)
  # --------------------------------------------------------------------------
  log_header "EXECUTANDO MIGRAÇÃO"
  local total_ops=$((total_actions + total_files + 1))
  local current_op=0

  # 1. Mover e transformar cada action.yml -> src/<action-name>/<action-name>.yml
  for action_name in "${valid_actions[@]}"; do
    current_op=$((current_op + 1))
    local legacy_dir="$LEGACY_ACTIONS_DIR/$action_name"
    local legacy_yml="$legacy_dir/$LEGACY_YML_NAME"
    local target_yml="$SRC_DIR/$action_name/$action_name.yml"

    cp "$legacy_yml" "$target_yml"

    # Atualiza caminhos internos dentro do próprio YAML (ex: actions/<name>/... -> dist/<name>/...)
    replace_in_file_perl "$target_yml" \
      "s{(['\"]?)(?:\./)?actions/\Q$action_name\E/([^'\"\s]+)(['\"]?)}{\${1}dist/$action_name/\$2\$3}g"

    rm -rf "$legacy_dir"

    log_step "$current_op" "$total_ops" \
      "Movido ${C_YELLOW}$legacy_yml${C_RESET} -> ${C_GREEN}$target_yml${C_RESET} (pasta antiga removida)"
  done

  # 2. Aplicar replaces em TS, YML e tsdown.config.*
  for ((i = 0; i < total_files; i++)); do
    current_op=$((current_op + 1))
    local file="${files_to_update[$i]}"
    local category="${file_categories[$i]}"
    local file_dir
    file_dir="$(dirname "$file")"

    case "$category" in
      TSDOWN_CONFIG)
        for action_name in "${valid_actions[@]}"; do
          replace_in_file_perl "$file" \
            "s{(['\"])(?:\./)?actions/\Q$action_name\E(/index\.ts)?(['\"])}{\$1src/$action_name\$2\$3}g"
        done
        ;;

      TS_IMPORT)
        for action_name in "${valid_actions[@]}"; do
          local target_base
          target_base="$(relative_path_from_dir "$file_dir" "$SRC_DIR/$action_name")"

          # Caso importe action.yml explicitamente
          replace_in_file_perl "$file" \
            "s{((?:import|export)\s+(?:[\s\S]*?\s+from\s+)?|require\s*\(\s*|import\s*\(\s*)(['\"])[^'\"]*?actions/\Q$action_name\E/action\.yml(['\"])}{\$1\$2$target_base/$action_name.yml\$3}g"

          # Caso importe diretório ou submódulo da action
          replace_in_file_perl "$file" \
            "s{((?:import|export)\s+(?:[\s\S]*?\s+from\s+)?|require\s*\(\s*|import\s*\(\s*)(['\"])[^'\"]*?actions/\Q$action_name\E(/[^'\"]*)?(['\"])}{\$1\$2$target_base\$3\$4}g"
        done
        ;;

      YML_REF)
        for action_name in "${valid_actions[@]}"; do
          # Referência explícita a actions/<name>/action.yml
          replace_in_file_perl "$file" \
            "s{((?:\./)?)actions/\Q$action_name\E/action\.yml}{\${1}src/$action_name/$action_name.yml}g"

          # Referência curta a ./actions/<name>
          replace_in_file_perl "$file" \
            "s{(\./)actions/\Q$action_name\E(?![\w\-./])}{\${1}src/$action_name/$action_name.yml}g"
        done
        ;;
    esac

    log_step "$current_op" "$total_ops" \
      "Atualizado [$category] ${C_CYAN}$file${C_RESET}"
  done

  # 3. Remover diretório raiz actions/ se estiver vazio
  current_op=$((current_op + 1))
  if [[ -z "$(ls -A "$LEGACY_ACTIONS_DIR")" ]]; then
    rmdir "$LEGACY_ACTIONS_DIR"
    log_step "$current_op" "$total_ops" \
      "Diretório raiz vazio ${C_YELLOW}$LEGACY_ACTIONS_DIR/${C_RESET} removido com sucesso."
  else
    log_step "$current_op" "$total_ops" \
      "Diretório $LEGACY_ACTIONS_DIR/ mantido pois ainda possui conteúdo restante."
  fi

  log_header "MIGRAÇÃO CONCLUÍDA COM SUCESSO"
}

main "$@"
