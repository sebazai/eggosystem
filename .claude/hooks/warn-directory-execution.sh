#!/bin/sh
# PreToolUse(Bash): advisory warning when pnpm/knex/turbo runs without
# a leading `cd $(git rev-parse --show-toplevel)` or `cd /workspace`.
# Per .cursor/rules/core/directory-execution.mdc. Non-blocking (exit 0).
set -eu

cmd=$(jq -r '.tool_input.command // ""')

# Extra hint: `pnpm typecheck --filter ...` is blocked by enforce-typecheck-command.sh,
# but this file is advisory and can surface the guidance even when the command is
# prefixed with `cd ... &&` (which bypasses the "starts with pnpm" check below).
case "$cmd" in
  *"pnpm "*"typecheck"*"--filter"*)
    echo "Hint: avoid 'pnpm typecheck --filter ...' (blocked). Run typecheck from the package directory instead, e.g. 'cd \$(git rev-parse --show-toplevel)/apps/frontend && rtk pnpm typecheck' or repo root 'cd \$(git rev-parse --show-toplevel) && pnpm typecheck'." >&2
    ;;
esac

# Only match bare pnpm/knex/turbo invocations at the start of the (sub)command.
case "$cmd" in
  "pnpm "*|"knex "*|"turbo "*)
    # Missing any cd prefix — warn
    echo "Hint: prefer 'cd \$(git rev-parse --show-toplevel)[/apps/{backend,frontend}] && $cmd' per .cursor/rules/core/directory-execution.mdc." >&2
    ;;
esac

exit 0
