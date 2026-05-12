#!/usr/bin/env bash
# Single-flight install of MariaDB MCP deps under /usr/local/mariadb-mcp (devcontainer image clone).
# Invoked from post-start (background) and/or run-mariadb-mcp.sh when Cursor starts MCP early.
#
# Callers attach stdout/stderr to /tmp/mariadb-mcp-venv.log via nohup … >> log 2>&1

exec 200>/tmp/mariadb-mcp-venv.flock
if ! flock -n 200; then
  echo "$(date -Iseconds) install-mariadb-mcp-local-venv: install already running (lock held)"
  exit 0
fi

if [ ! -f /usr/local/mariadb-mcp/src/server.py ]; then
  echo "$(date -Iseconds) install-mariadb-mcp-local-venv: skip — /usr/local/mariadb-mcp not cloned"
  exit 0
fi

if [ -f /usr/local/mariadb-mcp/.venv/bin/python ]; then
  echo "$(date -Iseconds) install-mariadb-mcp-local-venv: skip — venv already present"
  exit 0
fi

export PATH="/home/node/.local/bin:/usr/local/bin:${PATH}"

echo "$(date -Iseconds) install-mariadb-mcp-local-venv: starting uv venv / lock / sync (large download possible)"
cd /usr/local/mariadb-mcp || exit 1
uv venv && uv lock && uv sync --frozen
echo "$(date -Iseconds) install-mariadb-mcp-local-venv: finished OK"
