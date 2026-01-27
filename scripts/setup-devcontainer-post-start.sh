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

# Setup MCP readonly user (synchronous - must complete before MCP server starts)
echo "Setting up MCP readonly database user..."
/workspace/scripts/setup-mcp-readonly-user.sh

echo ""
echo "Starting background setup tasks..."

# Start Playwright installation in background
echo "Starting Playwright installation (this may take several minutes on first run)..."
# Create log file immediately so it can be tailed
touch /tmp/playwright-setup.log
(
  echo "Starting Playwright browser installation..." >> /tmp/playwright-setup.log 2>&1
  npx playwright install >> /tmp/playwright-setup.log 2>&1 && \
  echo "Starting Playwright system dependencies installation..." >> /tmp/playwright-setup.log 2>&1 && \
  npx playwright install-deps >> /tmp/playwright-setup.log 2>&1 && \
  echo "Playwright installation completed successfully!" >> /tmp/playwright-setup.log 2>&1 || \
  echo "Playwright installation failed. Check the log for details." >> /tmp/playwright-setup.log 2>&1
) &

# Start MariaDB MCP Server setup in background
echo "Starting MariaDB MCP Server setup (this may take several minutes on first run)..."
(/workspace/scripts/setup-mariadb-mcp-server.sh >> /tmp/mcp-setup.log 2>&1 &)

# Give background processes a moment to start
sleep 2

echo ""
echo "Background setup tasks started."
echo "Check progress with:"
echo "  tail -f /tmp/playwright-setup.log"
echo "  tail -f /tmp/mcp-setup.log"
echo "========================================="
