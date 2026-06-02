#!/bin/bash
# Post-startup script for devcontainer
# This runs after the container starts to set up various services
# Don't use set -e - we want to handle errors gracefully

echo "========================================="
echo "Running devcontainer post-start setup..."
echo "========================================="

# Image Node 24 before Cursor remote-server Node (pnpm 11 needs >= 22.13)
export PATH="/usr/local/bin:/usr/local/share/npm-global/bin:/home/node/.local/bin:${PATH}"

# Handle macOS X11 forwarding (if needed)
if [ "$(uname)" = "Darwin" ]; then
  xhost + 127.0.0.1 2>/dev/null || true
fi

# MariaDB MCP: image clones /usr/local/mariadb-mcp; venv + deps install in background (fast rebuilds).
# If the image has no clone yet, fall back to workspace clone (gitignored).
if [ -f /usr/local/mariadb-mcp/src/server.py ] && [ ! -f /usr/local/mariadb-mcp/.venv/bin/python ]; then
  touch /tmp/mariadb-mcp-venv.log
  nohup /workspace/scripts/install-mariadb-mcp-local-venv.sh >> /tmp/mariadb-mcp-venv.log 2>&1 &
  disown -h || true
fi

if [ ! -f /usr/local/mariadb-mcp/src/server.py ] && [ ! -f /workspace/mariadb-mcp/src/server.py ]; then
  touch /tmp/mariadb-mcp-setup.log
  nohup bash -c '/workspace/scripts/setup-mariadb-mcp-server.sh' >> /tmp/mariadb-mcp-setup.log 2>&1 &
  disown -h || true
fi

echo ""
echo "Starting background setup tasks..."

# Start Playwright installation in background (uses workspace pnpm script for correct deps)
# Must use nohup + disown so the install survives when this script exits (devcontainer
# may otherwise send SIGHUP and kill the child process).
echo "Starting Playwright installation (this may take several minutes on first run)..."
touch /tmp/playwright-setup.log
nohup bash -c '
  echo "Starting Playwright installation (pnpm install:playwright)..."
  cd /workspace && pnpm install:playwright && echo "Playwright installation completed successfully!" || echo "Playwright installation failed. Check the log for details."
' >> /tmp/playwright-setup.log 2>&1 &
disown -h

# FACEIT MCP server for Cursor (uv tool; PyPI without gpg-based CPython bootstrap). GitLab MCP uses npx.
echo "Starting faceit-mcp install (uv tool, latest from PyPI)..."
touch /tmp/faceit-mcp-setup.log
nohup bash -c '
  export PATH="/home/node/.local/bin:/usr/local/bin:$PATH"
  echo "Installing / upgrading faceit-mcp (uv tool install --upgrade faceit-mcp)..."
  uv tool install faceit-mcp --upgrade && echo "faceit-mcp installation completed successfully!" || echo "faceit-mcp installation failed. Check the log for details."
' >> /tmp/faceit-mcp-setup.log 2>&1 &
disown -h

# Give background processes a moment to start
sleep 2

echo ""
echo "Background setup tasks started."
echo "Check progress with:"
echo "  tail -f /tmp/mariadb-mcp-venv.log"
echo "  tail -f /tmp/playwright-setup.log"
echo "  tail -f /tmp/faceit-mcp-setup.log"
echo "========================================="
