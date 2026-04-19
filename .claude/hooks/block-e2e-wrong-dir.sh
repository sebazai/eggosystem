#!/bin/sh
# PreToolUse(Bash): enforce .cursor/rules/development/e2e-playwright.mdc.
# `pnpm test:e2e` must run from workspace root.
# `pnpm test:e2e:run` alone skips build+reseed; only allow when the same command
# chains `pnpm build && pnpm --filter=backend reseed:e2e`.
set -eu

cmd=$(jq -r '.tool_input.command // ""')

# Normalize: strip leading "cd ... && "
check="$cmd"

# 1) test:e2e:run — allow only if the command also builds and reseeds e2e DB
case "$cmd" in
  *"pnpm test:e2e:run"*|*"test:e2e:run"*)
    case "$cmd" in
      *"pnpm build"*"reseed:e2e"*|*"reseed:e2e"*"test:e2e:run"*) : ;;
      *)
        echo "BLOCKED: pnpm test:e2e:run skips build and E2E reseed. Use 'pnpm test:e2e' from workspace root instead. (.cursor/rules/development/e2e-playwright.mdc)" >&2
        exit 2
        ;;
    esac
    ;;
esac

# 2) pnpm test:e2e — must be preceded by cd to workspace root (or bare, at root cwd)
case "$cmd" in
  *"pnpm test:e2e"*|*"turbo test:e2e"*)
    # Allow if the command explicitly changes to workspace root
    case "$cmd" in
      *"cd \$(git rev-parse --show-toplevel)"*) exit 0 ;;
      *"cd /workspace"*|*"cd /workspace "*|*"cd /workspace&&"*) exit 0 ;;
    esac
    # Allow if we are at workspace root in this shell (best effort)
    if [ "$(pwd)" = "${CLAUDE_PROJECT_DIR:-/workspace}" ]; then
      exit 0
    fi
    echo "BLOCKED: 'pnpm test:e2e' must run from the workspace root. Prepend 'cd \$(git rev-parse --show-toplevel) && '. (.cursor/rules/development/e2e-playwright.mdc)" >&2
    exit 2
    ;;
esac

exit 0
