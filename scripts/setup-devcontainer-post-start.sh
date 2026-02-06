#!/bin/bash
# Post-startup script for devcontainer
# This runs after the container starts to set up various services
# Don't use set -e - we want to handle errors gracefully

echo "========================================="
echo "Running devcontainer post-start setup..."
echo "========================================="

# Handle macOS X11 forwarding (if needed)
if [ "$(uname)" = "Darwin" ]; then
  xhost + 127.0.0.1 2>/dev/null || true
fi

# MariaDB MCP server is baked into the image at /usr/local/mariadb-mcp during Docker build

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

# Give background processes a moment to start
sleep 2

echo ""
echo "Background setup tasks started."
echo "Check progress with:"
echo "  tail -f /tmp/playwright-setup.log"
echo "========================================="
