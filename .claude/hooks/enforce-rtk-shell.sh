#!/bin/sh
# Cursor beforeShellExecution + Claude Code PreToolUse(Bash): require wrapping
# high-noise tooling with rtk. See .cursor/rules/core/rtk-shell-usage.mdc and
# docs/rtk-reference.md.
#
# stdin: Cursor { "command", "cwd", ... } or Claude { "tool_input": { "command" } }
set -eu

if ! command -v jq >/dev/null 2>&1; then
  echo '{"permission":"allow"}'
  exit 0
fi

cmd=$(jq -r '(.command // .tool_input.command // "") | if . == null then "" else . end')
[ -z "$cmd" ] && echo '{"permission":"allow"}' && exit 0

proj_root="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$proj_root" ]; then
  proj_root="/workspace"
fi

tools='git|gh|pnpm|docker|kubectl|docker-compose'

# Bare tool at segment starts (BOF / after ; / && / || / single |).
bare_regex="(^[[:space:]]*(${tools})([[:space:]]|$))|(;[[:space:]]*(${tools})([[:space:]]|$))|(\&\&[[:space:]]*(${tools})([[:space:]]|$))|(\|\|[[:space:]]*(${tools})([[:space:]]|$))|(\|[[:space:]]*(${tools})([[:space:]]|$))"

# --- Exceptions: commands that should not be forced through rtk (project config) ---
rtk_config="$proj_root/.rtk/config.toml"
exclude_line=$(grep -E '^[[:space:]]*exclude_commands[[:space:]]*=' "$rtk_config" 2>/dev/null | head -1 || true)
is_excluded_first_word=false
trim_lead=$(printf '%s' "$cmd" | sed 's/^[[:space:]]*//')
first=${trim_lead%%[[:space:]]*}
if [ -n "$exclude_line" ]; then
  # shellcheck disable=SC2013
  for tok in $(printf '%s' "$exclude_line" | sed -n 's/^[^[]*\[\([^]]*\)].*/\1/p' | tr ',' '\n' | tr -d '"'); do
    tok=$(printf '%s' "$tok" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$tok" ] && continue
    if [ "$first" = "$tok" ]; then
      is_excluded_first_word=true
      break
    fi
  done
fi
if "$is_excluded_first_word"; then
  echo '{"permission":"allow"}'
  exit 0
fi

# --- Repo-root typecheck exception: plain `pnpm typecheck` (no rtk) -------------
has_chain=false
case "$cmd" in *"&&"*|*";"*|*"||"*|*"|"*) has_chain=true ;; esac
if ! "$has_chain"; then
  if printf '%s' "$trim_lead" | grep -Eq '^pnpm([[:space:]]+[^[:space:]]+)*[[:space:]]+typecheck([[:space:]]|$)'; then
    if ! printf '%s' "$cmd" | grep -Fq 'rtk pnpm'; then
      cwd_payload=$(jq -r '.cwd // empty')
      if [ -z "$cwd_payload" ]; then
        cwd_payload=$(pwd)
      fi
      if [ "$cwd_payload" = "$proj_root" ] || [ "$cwd_payload" = "${proj_root}/" ]; then
        echo '{"permission":"allow"}'
        exit 0
      fi
    fi
  fi
fi

allowed_root_tc=false
case "$cmd" in
  *"cd \$(git rev-parse --show-toplevel) && pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd \$(git rev-parse --show-toplevel)&&pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd \$(git rev-parse --show-toplevel) &&pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd \$(git rev-parse --show-toplevel)&& pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd /workspace && pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd /workspace&&pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd /workspace &&pnpm typecheck"*) allowed_root_tc=true ;;
  *"cd /workspace&& pnpm typecheck"*) allowed_root_tc=true ;;
  *) ;;
esac
if "$allowed_root_tc"; then
  echo '{"permission":"allow"}'
  exit 0
fi

# Hide $(git rev-parse ...) so nested `git` does not trip bare-git detection.
scan=$(printf '%s' "$cmd" | sed 's/\$(git[[:space:]]\+rev-parse[^)]*)/__/g')

# --- Block tsc without --noEmit (emits compiled JS/d.ts output files) ---------
# Matches `tsc` as a command word after any prefix (rtk, pnpm, npx, bare, etc.)
if printf '%s' "$scan" | grep -Eq '(^|[[:space:];|&])tsc([[:space:]]|$)'; then
  if ! printf '%s' "$cmd" | grep -Fq -- '--noEmit'; then
    msg='`tsc` without `--noEmit` emits compiled JS files. Use `pnpm typecheck` (in apps/backend or apps/frontend) instead of calling tsc directly.'
    jq -n \
      --arg um "$msg" \
      --arg am "$msg" \
      '{"permission":"deny","user_message":$um,"agent_message":$am,"continue":true}'
    exit 0
  fi
fi

if printf '%s' "$scan" | grep -Eq "$bare_regex"; then
  msg='Use rtk for this shell command (prefix the binary with `rtk `), per `.cursor/rules/core/rtk-shell-usage.mdc`. Exception: repo-root typecheck uses `pnpm typecheck` without rtk (`cd $(git rev-parse --show-toplevel) && pnpm typecheck`). See `docs/rtk-reference.md`.'
  jq -n \
    --arg um "$msg" \
    --arg am "$msg" \
    '{"permission":"deny","user_message":$um,"agent_message":$am,"continue":true}'
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
