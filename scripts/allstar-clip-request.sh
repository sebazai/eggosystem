#!/bin/bash

# Default values
ALLSTAR_API_KEY=${ALLSTAR_API_KEY}
DEMO_URL=${1:-"https://stats.kanaliiga.fi/testdata/game1nuke.dem"}
WEBHOOK_URL="https://hub.kanaliiga.fi/api/v1/allstar/webhook"
METADATA_KEY=${2:-"game_id"}
METADATA_VALUE=${3:-"105968"}

# Show usage if help is requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Usage: ./allstar-clip-request.sh [DEMO_URL] [METADATA_KEY] [METADATA_VALUE]"
  echo ""
  echo "Parameters:"
  echo "  DEMO_URL       - URL to the demo file (default: https://stats.kanaliiga.fi/testdata/1-94cbcea0-8389-4713-ac9d-e53d04514b29-1-1.dem)"
  echo "  METADATA_KEY   - Optional metadata key"
  echo "  METADATA_VALUE - Optional metadata value"
  echo ""
  echo "Notes:"
  echo "  - Webhook URL is fixed to: $WEBHOOK_URL"
  echo "  - API key is set to environment variable ALLSTAR_API_KEY or uses default in script"
  exit 0
fi

# Prepare JSON data with conditional metadata
if [[ -n "$METADATA_KEY" && -n "$METADATA_VALUE" ]]; then
  JSON_DATA=$(cat <<EOF
{
  "demoUrl": "$DEMO_URL",
  "webhookUrl": "$WEBHOOK_URL",
  "metadata": [
    {
      "key": "$METADATA_KEY",
      "value": "$METADATA_VALUE"
    }
  ]
}
EOF
  )
else
  JSON_DATA=$(cat <<EOF
{
  "demoUrl": "$DEMO_URL"
}
EOF
  )
fi

# Make the API request
echo "Sending clip request to AllStar.gg..."
echo "Demo URL: $DEMO_URL"
echo "Webhook URL: $WEBHOOK_URL"
if [[ -n "$METADATA_KEY" ]]; then
  echo "Metadata: $METADATA_KEY = $METADATA_VALUE"
fi

RESPONSE=$(curl -s -X POST "https://prt.allstar.gg/cs/clip/potg" \
  -H "X-API-Key: $ALLSTAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA")

# Display the response
echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo "Request completed."