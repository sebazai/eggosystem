#!/usr/bin/env bash
# Launcher for @zereight/mcp-gitlab: load gitignored .env.mcp from repo root.
# Invoked as: bash .cursor/gitlab-mcp.sh (Cursor usually uses workspace root as cwd).
set -euo pipefail
_script="${BASH_SOURCE[0]:-$0}"
[[ "$_script" != /* ]] && _script="$(pwd)/$_script"
_here="$(cd "$(dirname "$_script")" && pwd)"
_root="$(cd "$_here/.." && pwd)"
if [[ -f "$_root/.env.mcp" ]]; then
  set -a
  # shellcheck source=/dev/null
  . "$_root/.env.mcp"
  set +a
fi
exec npx -y @zereight/mcp-gitlab
