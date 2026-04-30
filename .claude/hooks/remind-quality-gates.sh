#!/bin/sh
# Stop: if TS/TSX files under apps/ or packages/ have uncommitted changes,
# remind the model to run `pnpm quality` before stopping.
# Per .cursor/rules/development/quality-gates.mdc.
# Cursor stop hook: log reminder to stderr and emit {} (see cursor.com/docs/hooks —
# followup_message would auto-submit and can loop while git is still dirty).
set -eu

hook_input=$(cat || true)
root="${CLAUDE_PROJECT_DIR:-/workspace}"
cd "$root" 2>/dev/null || exit 0

# Only consider changes to TS/TSX in apps/ or packages/
changed=$(git status --porcelain 2>/dev/null \
  | awk '{ $1=""; sub(/^ /,""); print }' \
  | grep -E '^(apps|packages)/.*\.(ts|tsx)$' \
  || true)

[ -z "$changed" ] && exit 0

msg="Reminder: TypeScript files were modified this session. Run: pnpm knip && pnpm typecheck && pnpm format:check && pnpm lint (or 'pnpm quality'). Note: typecheck command shapes are enforced by a preToolUse hook."

if echo "$hook_input" | jq -e 'has("loop_count")' >/dev/null 2>&1; then
  printf '%s\n' "$msg" >&2
  printf '%s\n' '{}'
  exit 0
fi

# Claude Code Stop: additional context via systemMessage
jq -n --arg msg "$msg" '{ "systemMessage": $msg }'

exit 0
