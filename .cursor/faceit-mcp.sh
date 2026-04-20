#!/usr/bin/env bash
# Launcher for faceit-mcp (FACEIT Data API v4 MCP): load gitignored .env.mcp from repo root.
# Invoked as: bash .cursor/faceit-mcp.sh (Cursor usually uses workspace root as cwd).
# Install: latest from PyPI — https://pypi.org/project/faceit-mcp/ (see setup-devcontainer-post-start.sh)
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
# pip --user (~/.local/bin) and devcontainer Python feature (/usr/local/python/current/bin)
export PATH="${HOME}/.local/bin:/usr/local/python/current/bin:${PATH}"
exec faceit-mcp "$@"
