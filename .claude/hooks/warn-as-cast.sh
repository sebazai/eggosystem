#!/bin/sh
# PostToolUse(Edit|Write|MultiEdit): warn on unsafe `as` type casts in TS files.
# Enforces .cursor/rules/core/architecture-constraints.mdc + skills/type-safety.
# Non-blocking: exit 0 always, write warnings to stderr.
set -eu

file=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.target_file // .tool_response.filePath // ""')

# Only TS/TSX under apps/ or packages/
case "$file" in
  *"/apps/"*.ts|*"/apps/"*.tsx|*"/packages/"*.ts|*"/packages/"*.tsx) : ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

# Match ` as ` that is NOT `as const` and NOT on an eslint-disable line.
matches=$(grep -nE '[[:space:])]as[[:space:]]+[A-Za-z_]' "$file" 2>/dev/null \
  | grep -vE 'as[[:space:]]+const\b' \
  | grep -vE 'eslint-disable' \
  || true)

if [ -n "$matches" ]; then
  printf 'Type-safety warning in %s — `as` casting found (project rule: use `satisfies` or type guards, see .cursor/skills/type-safety):\n%s\n' \
    "$file" "$matches" >&2
fi

exit 0
