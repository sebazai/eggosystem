#!/usr/bin/env bash
# Wrapper to ensure MariaDB MCP is cloned and built before starting.
# Cursor may start this MCP before postStartCommand has run; we bootstrap here if needed.
# Setup output goes to a log file so we don't corrupt MCP stdio.

if [ ! -f /workspace/mariadb-mcp/src/server.py ]; then
  /workspace/scripts/setup-mariadb-mcp-server.sh >> /tmp/mariadb-mcp-setup.log 2>&1
fi

exec uv --directory /workspace/mariadb-mcp run src/server.py
