#!/bin/bash
set -e

# Check if required variables are set
if [ -z "$PORTAINER_URL" ] || [ -z "$PORTAINER_TOKEN" ] || [ -z "$ENV_ID" ]; then
  echo "Error: Required variables PORTAINER_URL, PORTAINER_TOKEN, and ENV_ID must be set"
  exit 1
fi

# First, check if we can access the Portainer API
echo "Testing Portainer API access..."
PORTAINER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PORTAINER_URL}/api/system/status" -H "X-API-Key: ${PORTAINER_TOKEN}")
if [ "$PORTAINER_STATUS" != "200" ]; then
  echo "Error: Cannot access Portainer API. Status code: $PORTAINER_STATUS"
  echo "Please check your PORTAINER_URL and PORTAINER_TOKEN"
  exit 1
fi

# Check if ENDPOINT_ID is set, if not, try to get it from Portainer
if [ -z "$ENDPOINT_ID" ]; then
  echo "ENDPOINT_ID not set, attempting to get it from Portainer..."
  ENDPOINTS=$(curl -s "${PORTAINER_URL}/api/endpoints" -H "X-API-Key: ${PORTAINER_TOKEN}")
  ENDPOINT_ID=$(echo "$ENDPOINTS" | jq -r '.[0].Id')
  
  if [ -z "$ENDPOINT_ID" ] || [ "$ENDPOINT_ID" = "null" ]; then
    echo "Warning: Could not find any endpoints in Portainer, defaulting to ENDPOINT_ID=1"
    ENDPOINT_ID=1
  else
    echo "Using endpoint ID: $ENDPOINT_ID"
  fi
fi

echo "Cleaning up stack eggosystem-${ENV_ID} from Portainer..."

# Get stack ID
STACK_ID=$(curl -s "${PORTAINER_URL}/api/stacks?endpointId=${ENDPOINT_ID}" \
  -H "X-API-Key: ${PORTAINER_TOKEN}" | \
  jq -r '.[] | select(.Name=="eggosystem-'${ENV_ID}'") | .Id')

if [ -z "$STACK_ID" ]; then
  echo "Stack eggosystem-${ENV_ID} not found or already removed"
  exit 0
else
  echo "Stopping and removing stack eggosystem-${ENV_ID}..."
  # Stop the stack
  curl -X POST "${PORTAINER_URL}/api/stacks/${STACK_ID}/stop?endpointId=${ENDPOINT_ID}" \
    -H "X-API-Key: ${PORTAINER_TOKEN}"
  
  # Remove the stack
  curl -X DELETE "${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}" \
    -H "X-API-Key: ${PORTAINER_TOKEN}"
  
  echo "Environment stopped and removed successfully from Portainer"
fi 