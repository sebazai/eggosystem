#!/usr/bin/env bash
# Wrapper to ensure MariaDB MCP is cloned and built before starting.
# Cursor may start this MCP before postStartCommand has run; we bootstrap here if needed.
# Setup output goes to a log file so we don't corrupt MCP stdio.

# Cursor often spawns MCP with a minimal PATH; use the image-installed binary explicitly.
UV_BIN="${UV_BIN:-/usr/local/bin/uv}"
if [ ! -x "$UV_BIN" ]; then
  echo "run-mariadb-mcp: uv not found at $UV_BIN" >&2
  exit 1
fi

if [ -f /usr/local/mariadb-mcp/src/server.py ]; then
  if [ ! -f /usr/local/mariadb-mcp/.venv/bin/python ]; then
    # Same single-flight installer as post-start (Cursor may spawn MCP before postStartCommand runs).
    nohup /workspace/scripts/install-mariadb-mcp-local-venv.sh >> /tmp/mariadb-mcp-venv.log 2>&1 &
    disown -h 2>/dev/null || true
    echo "run-mariadb-mcp: Python deps for MariaDB MCP are installing in the background (can take many minutes). Retry MCP after: tail -f /tmp/mariadb-mcp-venv.log shows \"finished OK\"." >&2
    exit 1
  fi
  exec "$UV_BIN" --directory /usr/local/mariadb-mcp run src/server.py
fi

if [ ! -f /workspace/mariadb-mcp/src/server.py ]; then
  /workspace/scripts/setup-mariadb-mcp-server.sh >> /tmp/mariadb-mcp-setup.log 2>&1
fi

if [ ! -f /workspace/mariadb-mcp/src/server.py ]; then
  echo "run-mariadb-mcp: MariaDB MCP not available after setup; see /tmp/mariadb-mcp-setup.log" >&2
  exit 1
fi

exec "$UV_BIN" --directory /workspace/mariadb-mcp run src/server.py
