#!/bin/sh
# Run a hook from .claude/hooks/ with CLAUDE_PROJECT_DIR set to the repo root
# (same scripts as Claude Code; see .claude/settings.json).
set -eu
hook_script="$1"
HOOK_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
export CLAUDE_PROJECT_DIR=$(CDPATH= cd -- "$HOOK_DIR/../.." && pwd)
exec sh "$CLAUDE_PROJECT_DIR/.claude/hooks/$hook_script"
