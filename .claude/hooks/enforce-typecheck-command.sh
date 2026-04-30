#!/bin/sh
# PreToolUse(Shell): enforce reliable typecheck command shapes.
#
# Rules:
# - Never use `--filter` with `pnpm typecheck`.
# - Never run `rtk pnpm typecheck` from the repo root.
# - Allowed:
#   - cd $(git rev-parse --show-toplevel)/apps/frontend && rtk pnpm typecheck
#   - cd $(git rev-parse --show-toplevel)/apps/backend  && rtk pnpm typecheck
#   - cd $(git rev-parse --show-toplevel)/packages/types && rtk pnpm typecheck
#   - cd $(git rev-parse --show-toplevel) && pnpm typecheck   (no rtk at root)
set -eu

cmd=$(jq -r '.tool_input.command // ""')
[ -z "$cmd" ] && exit 0

# Only care about typecheck commands.
case "$cmd" in
  *"typecheck"*) ;;
  *) exit 0 ;;
esac

# 1) Hard block: pnpm typecheck with --filter (unreliable / surprising scope).
if printf '%s' "$cmd" | grep -q 'pnpm' && printf '%s' "$cmd" | grep -q 'typecheck' && printf '%s' "$cmd" | grep -q -- '--filter'; then
  echo "BLOCKED: do not use --filter with typecheck. Run typecheck from the package directory instead (apps/frontend, apps/backend, or packages/types)." >&2
  exit 2
fi

# 2) If using RTK for typecheck, require it to run in an allowed package directory.
case "$cmd" in
  *"rtk pnpm "*"typecheck"*)
    # Explicitly allowed cd targets
    case "$cmd" in
      *"cd \$(git rev-parse --show-toplevel)/apps/frontend"* ) exit 0 ;;
      *"cd \$(git rev-parse --show-toplevel)/apps/backend"* ) exit 0 ;;
      *"cd \$(git rev-parse --show-toplevel)/packages/types"* ) exit 0 ;;
      *"cd /workspace"*/apps/frontend* ) exit 0 ;;
      *"cd /workspace"*/apps/backend* ) exit 0 ;;
      *"cd /workspace"*/packages/types* ) exit 0 ;;
    esac

    # Block explicit repo-root cd + rtk typecheck.
    case "$cmd" in
      *"cd \$(git rev-parse --show-toplevel)"*"rtk pnpm "*"typecheck"*)
        echo "BLOCKED: do not run 'rtk pnpm typecheck' from repo root. Use: cd \$(git rev-parse --show-toplevel)/apps/{frontend,backend} && rtk pnpm typecheck (or packages/types)." >&2
        exit 2
        ;;
      *"cd /workspace"*rtk\ pnpm*typecheck*)
        echo "BLOCKED: do not run 'rtk pnpm typecheck' from repo root. Use: cd \$(git rev-parse --show-toplevel)/apps/{frontend,backend} && rtk pnpm typecheck (or packages/types)." >&2
        exit 2
        ;;
    esac

    # Best-effort: if command relies on current cwd, block when cwd is repo root.
    root="${CLAUDE_PROJECT_DIR:-/workspace}"
    if [ "$(pwd)" = "$root" ]; then
      echo "BLOCKED: do not run 'rtk pnpm typecheck' from repo root. Use: cd \$(git rev-parse --show-toplevel)/apps/{frontend,backend} && rtk pnpm typecheck (or packages/types)." >&2
      exit 2
    fi
    ;;
esac

exit 0

