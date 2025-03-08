#!/bin/bash
set -e

# Set required variables for the mr-local stack
export PORTAINER_URL="https://portainer.kanaliiga.fi"  # Default Portainer URL, adjust if needed
export ENDPOINT_ID="1"  # Add the endpoint ID parameter (usually 1 for the local Docker environment)
export ENV_ID="mr-local"

# Check if PORTAINER_TOKEN is set, otherwise prompt for it
if [ -z "$PORTAINER_TOKEN" ]; then
  echo "Please enter your Portainer API token:"
  read -s PORTAINER_TOKEN
  export PORTAINER_TOKEN
fi

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the cleanup-portainer-stack.sh script
echo "Running cleanup for mr-local stack..."
"$SCRIPT_DIR/cleanup-portainer-stack.sh"

echo "mr-local stack cleanup completed" 