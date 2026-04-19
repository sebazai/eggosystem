#!/bin/sh
# PostToolUse(Edit|Write|MultiEdit): warn when a TS file has `try {` but no `finally`.
# Enforces .cursor/skills/error-handling: try/catch only when a `finally` cleanup exists.
# Non-blocking: exit 0 always.
set -eu

file=$(jq -r '.tool_input.file_path // .tool_input.path // .tool_input.target_file // .tool_response.filePath // ""')

case "$file" in
  *"/apps/"*.ts|*"/apps/"*.tsx|*"/packages/"*.ts|*"/packages/"*.tsx) : ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

try_count=$(grep -cE '^[[:space:]]*try[[:space:]]*\{' "$file" 2>/dev/null) || try_count=0
finally_count=$(grep -cE '\}[[:space:]]*finally[[:space:]]*\{|^[[:space:]]*finally[[:space:]]*\{' "$file" 2>/dev/null) || finally_count=0

if [ "${try_count:-0}" -gt 0 ] && [ "${try_count:-0}" -gt "${finally_count:-0}" ]; then
  printf 'try/catch warning in %s — %s try block(s), %s finally block(s). Project rule: try/catch only for DB transactions with cleanup (.cursor/skills/error-handling).\n' \
    "$file" "$try_count" "$finally_count" >&2
fi

exit 0
