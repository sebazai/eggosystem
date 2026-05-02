#!/bin/bash
# Don't use set -e - we want to handle errors gracefully

echo "========================================="
echo "Setting up MariaDB MCP Server..."
echo "========================================="

# Python 3.11 is uv-managed (prebuilt downloads; see .devcontainer/Dockerfile) plus /usr/local/bin/python3.11 symlink.
if ! command -v python3.11 &> /dev/null; then
  echo "Error: Python 3.11 not found. Rebuild the devcontainer (Dockerfile installs it via uv python install)."
  exit 0
fi

# Check if already fully installed
# Use python3.11 -m uv to check if uv is available (works even if not in PATH)
if [ -d "/workspace/mariadb-mcp" ] && (command -v uv &> /dev/null || python3.11 -m uv --version &> /dev/null) && [ -f "/workspace/mariadb-mcp/.venv/bin/python" ]; then
  echo "MariaDB MCP Server already installed and ready!"
  exit 0
fi

# Install uv if not available (Python feature may not include it)
# Check both direct command and python module
if ! command -v uv &> /dev/null && ! python3.11 -m uv --version &> /dev/null; then
  echo "Installing uv package manager..."
  echo "This may take a few minutes on first run..."
  # Use timeout to prevent hanging, and show output for debugging
  timeout 300 python3.11 -m pip install --break-system-packages uv 2>&1 || {
    echo "Warning: Failed to install uv (timeout or error). MariaDB MCP Server setup skipped."
    echo "You can try installing manually with: python3.11 -m pip install --break-system-packages uv"
    exit 0
  }
  echo "uv installed successfully"
fi

# Clone MariaDB MCP Server if not exists
if [ ! -d "/workspace/mariadb-mcp" ]; then
  echo "Cloning MariaDB MCP Server repository..."
  git clone --quiet https://github.com/MariaDB/mcp.git /workspace/mariadb-mcp || {
    echo "Warning: Failed to clone MariaDB MCP Server repository."
    exit 0
  }
fi

# Prefer uv binary (from Dockerfile) when available; fall back to python3.11 -m uv
UV_CMD="python3.11 -m uv"
if command -v uv &> /dev/null; then UV_CMD="uv"; fi

# Install dependencies
if [ ! -f "/workspace/mariadb-mcp/.venv/bin/python" ]; then
  echo "Installing MariaDB MCP Server dependencies..."
  cd /workspace/mariadb-mcp && \
  $UV_CMD lock && \
  $UV_CMD sync || {
    echo "Warning: Failed to install MariaDB MCP Server dependencies."
    exit 0
  }
fi

echo "========================================="
echo "MariaDB MCP Server setup completed!"
echo "========================================="
