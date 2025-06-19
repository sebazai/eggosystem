#!/bin/bash

# Script to kill all next-server processes
# This is useful for cleaning up defunct/zombie processes

echo "Finding next-server processes..."

# Get all next-server process IDs
PIDS=$(ps aux | grep next-server | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
    echo "No next-server processes found."
    exit 0
fi

echo "Found next-server processes with PIDs:"
echo "$PIDS"
echo ""

# Count the processes
COUNT=$(echo "$PIDS" | wc -w)
echo "Killing $COUNT next-server process(es)..."

# Kill each process with SIGKILL (-9)
for pid in $PIDS; do
    echo "Killing process $pid..."
    kill -9 "$pid" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully killed process $pid"
    else
        echo "✗ Failed to kill process $pid (may already be dead)"
    fi
done

echo ""
echo "Cleanup complete. Checking for remaining next-server processes..."

# Check if any processes remain
REMAINING=$(ps aux | grep next-server | grep -v grep | awk '{print $2}')

if [ -z "$REMAINING" ]; then
    echo "✓ All next-server processes have been terminated."
else
    echo "⚠ Some next-server processes may still be running:"
    echo "$REMAINING"
fi 