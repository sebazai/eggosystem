#!/bin/bash

# Default values
ALLSTAR_API_KEY=${ALLSTAR_API_KEY}
CLIP_IDENTIFIER=${1:-""}

# Show usage if help is requested or no clip identifier provided
if [[ "$1" == "--help" || "$1" == "-h" || -z "$CLIP_IDENTIFIER" ]]; then
  echo "Usage: ./clip-status.sh <CLIP_IDENTIFIER>"
  echo ""
  echo "Parameters:"
  echo "  CLIP_IDENTIFIER    - Identifier of the clip to check status for (required)"
  echo ""
  echo "Notes:"
  echo "  - API key is set to environment variable ALLSTAR_API_KEY or uses default in script"
  exit 0
fi

# Make the API request
echo "Checking clip status for identifier: $CLIP_IDENTIFIER"

RESPONSE=$(curl -s -X GET "https://prt.allstar.gg/cs/clip/status?clip_identifier=$CLIP_IDENTIFIER" \
  -H "X-API-Key: $ALLSTAR_API_KEY" \
  -H "Content-Type: application/json")

# Display the response
echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo "Status check completed." 