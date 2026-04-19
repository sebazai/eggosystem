#!/bin/sh
# PreToolUse(Bash): advisory warning when pnpm/knex/turbo runs without
# a leading `cd $(git rev-parse --show-toplevel)` or `cd /workspace`.
# Per .cursor/rules/core/directory-execution.mdc. Non-blocking (exit 0).
set -eu

cmd=$(jq -r '.tool_input.command // ""')

# Only match bare pnpm/knex/turbo invocations at the start of the (sub)command.
case "$cmd" in
  "pnpm "*|"knex "*|"turbo "*)
    # Missing any cd prefix — warn
    echo "Hint: prefer 'cd \$(git rev-parse --show-toplevel)[/apps/{backend,frontend}] && $cmd' per .cursor/rules/core/directory-execution.mdc." >&2
    ;;
esac

exit 0
