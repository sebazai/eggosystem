#!/bin/sh
# Cursor `afterFileEdit` and Claude Code `PostToolUse` (Edit|Write|…): run Prettier
# on the saved file when it matches repo format globs. Non-blocking (exit 0).
set -eu

input=$(cat || true)

file_path=$(printf '%s' "$input" | jq -r '
  [
    .file_path,
    .tool_input.file_path,
    .tool_input.path,
    .tool_input.target_file,
    .tool_response.filePath
  ]
  | map(select(. != null and type == "string" and length > 0))
  | .[0] // empty
')

[ -n "$file_path" ] || exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *"/node_modules/"*|*"/.git/"*) exit 0 ;;
esac

case "$file_path" in
  *.ts|*.tsx|*.md|*.mjs|*.js|*.jsx|*.json) : ;;
  *) exit 0 ;;
esac

root=$(printf '%s' "$input" | jq -r '.workspace_roots[0] // empty')
if [ -z "$root" ]; then
  root="${CLAUDE_PROJECT_DIR:-}"
fi
if [ -z "$root" ]; then
  root=$(git -C "$(dirname "$file_path")" rev-parse --show-toplevel 2>/dev/null || true)
fi
[ -n "$root" ] || exit 0

cd "$root" || exit 0
command -v pnpm >/dev/null 2>&1 || exit 0

pnpm exec prettier --write --ignore-unknown -- "$file_path" || true

exit 0
