#!/bin/bash

# Kill background processes when the script is terminated
trap 'kill $(jobs -p)' EXIT

# Export environment variables from .env.development if it exists
if [ -f .env.development ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
fi

# Run frontend and backend in parallel
echo "Starting frontend and backend services..."
pnpm dev &

# Wait for all background processes
wait
