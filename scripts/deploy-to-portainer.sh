#!/bin/bash
set -e

# Default to non-verbose mode
VERBOSE=false
# Default to removing failed stacks
KEEP_FAILED_STACK=${KEEP_FAILED_STACK:-false}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    --keep-failed)
      KEEP_FAILED_STACK=true
      shift
      ;;
    *)
      COMPOSE_FILE_PATH="$1"
      shift
      ;;
  esac
done

# Function to print debug messages only in verbose mode
debug() {
  if [ "$VERBOSE" = true ]; then
    echo "[DEBUG] $1"
  fi
}

# Check if required variables are set
if [ -z "$PORTAINER_URL" ] || [ -z "$PORTAINER_TOKEN" ] || [ -z "$ENV_ID" ]; then
  echo "Error: Required variables PORTAINER_URL, PORTAINER_TOKEN, and ENV_ID must be set"
  echo "PORTAINER_URL: ${PORTAINER_URL}"
  echo "PORTAINER_TOKEN length: ${#PORTAINER_TOKEN}"
  echo "ENV_ID: ${ENV_ID}"
  exit 1
fi

if [ -z "$COMPOSE_FILE_PATH" ]; then
  echo "Error: Please provide the path to the docker-compose file as an argument"
  echo "Usage: $0 [--verbose] [--keep-failed] <docker-compose-file>"
  exit 1
fi

echo "Using compose file: $COMPOSE_FILE_PATH"
if [ "$KEEP_FAILED_STACK" = true ]; then
  echo "Keep failed stack option is enabled. Failed stacks will not be removed."
fi

# Read the compose file content
COMPOSE_CONTENT=$(cat "$COMPOSE_FILE_PATH")


# Base64 encode the compose file for API calls that need it
COMPOSE_FILE_BASE64=$(cat "$COMPOSE_FILE_PATH" | base64 -w 0)

echo "Deploying stack eggosystem-${ENV_ID} to Portainer at ${PORTAINER_URL}..."

# First, check if we can access the Portainer API
echo "Testing Portainer API access..."
PORTAINER_STATUS_RESPONSE=$(curl -s "${PORTAINER_URL}/api/system/status" -H "X-API-Key: ${PORTAINER_TOKEN}")
PORTAINER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PORTAINER_URL}/api/system/status" -H "X-API-Key: ${PORTAINER_TOKEN}")
debug "Portainer API status code: $PORTAINER_STATUS"
if [ "$VERBOSE" = true ]; then
  debug "Portainer API status response: $(echo "$PORTAINER_STATUS_RESPONSE" | jq 2>/dev/null || echo "$PORTAINER_STATUS_RESPONSE")"
fi

if [ "$PORTAINER_STATUS" != "200" ]; then
  echo "Error: Cannot access Portainer API. Status code: $PORTAINER_STATUS"
  echo "Please check your PORTAINER_URL and PORTAINER_TOKEN"
  exit 1
fi

# Get the endpoint ID
echo "Getting endpoint ID..."
ENDPOINTS=$(curl -s "${PORTAINER_URL}/api/endpoints" -H "X-API-Key: ${PORTAINER_TOKEN}")
if [ "$VERBOSE" = true ]; then
  debug "Endpoints response: $(echo "$ENDPOINTS" | jq 2>/dev/null || echo "$ENDPOINTS")"
fi
ENDPOINT_ID=$(echo "$ENDPOINTS" | jq -r '.[0].Id')

if [ -z "$ENDPOINT_ID" ] || [ "$ENDPOINT_ID" = "null" ]; then
  echo "Error: Could not find any endpoints in Portainer"
  exit 1
fi

echo "Using endpoint ID: $ENDPOINT_ID"

# Check if stack already exists
echo "Checking if stack already exists..."
STACKS=$(curl -s "${PORTAINER_URL}/api/stacks" -H "X-API-Key: ${PORTAINER_TOKEN}")
if [ "$VERBOSE" = true ]; then
  debug "Available stacks: $(echo "$STACKS" | jq 2>/dev/null || echo "$STACKS")"
fi
STACK_ID=$(echo "$STACKS" | jq -r '.[] | select(.Name=="eggosystem-'"${ENV_ID}"'") | .Id')

if [ -z "$STACK_ID" ] || [ "$STACK_ID" = "null" ]; then
  # Stack doesn't exist, create a new one
  echo "Stack doesn't exist. Creating new stack..."
  
  # Create a temporary file with properly escaped content
  TMP_COMPOSE_FILE=$(mktemp)
  echo "$COMPOSE_CONTENT" > "$TMP_COMPOSE_FILE"
  
  # Create new stack using string content endpoint (method 2)
  echo "Creating new stack using string content..."
  
  # Properly escape the compose content for JSON
  COMPOSE_CONTENT_ESCAPED=$(echo "$COMPOSE_CONTENT" | jq -Rs .)
  
  CREATE_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/stacks/create/standalone/string?endpointId=${ENDPOINT_ID}" \
    -H "X-API-Key: ${PORTAINER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"eggosystem-${ENV_ID}\",
      \"stackFileContent\": ${COMPOSE_CONTENT_ESCAPED}
    }")
  
  CREATE_STATUS=$?
  if [ "$VERBOSE" = true ]; then
    debug "Create stack status code: $CREATE_STATUS"
    debug "Create stack response: $(echo "$CREATE_RESPONSE" | jq 2>/dev/null || echo "$CREATE_RESPONSE")"
  fi
  
  # Extract the stack ID from the response
  STACK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.Id // empty' 2>/dev/null || echo "")
  
  if [ $CREATE_STATUS -ne 0 ] || [ -z "$STACK_ID" ] || [ "$STACK_ID" = "null" ]; then
    echo "Stack creation failed."
    echo "Error response from Portainer: $(echo "$CREATE_RESPONSE" | jq -r '.message // .err // empty' 2>/dev/null || echo "$CREATE_RESPONSE")"
    
    # Clean up temporary file
    rm -f "$TMP_COMPOSE_FILE"
    if [ "$KEEP_FAILED_STACK" = false ]; then
      echo "Removing failed stack..."
      curl -s -X DELETE "${PORTAINER_URL}/api/stacks/${STACK_ID}" -H "X-API-Key: ${PORTAINER_TOKEN}"
    fi
    exit 1
  else
    echo "Stack created successfully with ID: $STACK_ID"
  fi
  
  # Clean up temporary file
  rm -f "$TMP_COMPOSE_FILE"
else
  # Stack exists, update it
  echo "Found existing stack ID: $STACK_ID. Updating..."
  
  # Properly escape the compose content for JSON
  COMPOSE_CONTENT_ESCAPED=$(echo "$COMPOSE_CONTENT" | jq -Rs .)
  
  UPDATE_RESPONSE=$(curl -s -X PUT "${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}" \
    -H "X-API-Key: ${PORTAINER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"env\": [],
      \"prune\": true,
      \"pullImage\": true,
      \"stackFileContent\": ${COMPOSE_CONTENT_ESCAPED}  
    }")
  
  UPDATE_STATUS=$?
  if [ "$VERBOSE" = true ]; then
    debug "Update stack status code: $UPDATE_STATUS"
    debug "Update stack response: $(echo "$UPDATE_RESPONSE" | jq 2>/dev/null || echo "$UPDATE_RESPONSE")"
  fi
  
  if [ $UPDATE_STATUS -ne 0 ]; then
    echo "Stack update failed."
    echo "Error response from Portainer: $(echo "$UPDATE_RESPONSE" | jq -r '.message // .err // empty' 2>/dev/null || echo "$UPDATE_RESPONSE")"
    if [ "$KEEP_FAILED_STACK" = false ]; then
      echo "Removing failed stack..."
      curl -s -X DELETE "${PORTAINER_URL}/api/stacks/${STACK_ID}" -H "X-API-Key: ${PORTAINER_TOKEN}"
    fi
    exit 1
  else
    echo "Stack updated successfully"
  fi
fi

# Verify the stack exists after creation/update
echo "Verifying stack exists..."
VERIFY_STACKS=$(curl -s "${PORTAINER_URL}/api/stacks" -H "X-API-Key: ${PORTAINER_TOKEN}")
VERIFY_STACK_ID=$(echo "$VERIFY_STACKS" | jq -r '.[] | select(.Name=="eggosystem-'"${ENV_ID}"'") | .Id')

if [ -z "$VERIFY_STACK_ID" ] || [ "$VERIFY_STACK_ID" = "null" ]; then
  echo "Warning: Could not verify stack exists after creation/update!"
  echo "Available stacks:"
  echo "$VERIFY_STACKS" | jq -r '.[].Name'
else
  echo "Stack verified with ID: $VERIFY_STACK_ID"
  
  # Get stack details
  STACK_DETAILS=$(curl -s "${PORTAINER_URL}/api/stacks/${VERIFY_STACK_ID}" -H "X-API-Key: ${PORTAINER_TOKEN}")
  if [ "$VERBOSE" = true ]; then
    debug "Stack details: $(echo "$STACK_DETAILS" | jq 2>/dev/null || echo "$STACK_DETAILS")"
  fi
  
  # Check stack status
  STACK_STATUS=$(echo "$STACK_DETAILS" | jq -r '.Status // empty')
  if [ ! -z "$STACK_STATUS" ]; then
    echo "Stack status: $STACK_STATUS"
  fi
fi

echo "Stack deployment completed"

# Display deployment URLs
echo ""
echo "=== DEPLOYMENT INFORMATION ==="
echo "Stack Name: eggosystem-${ENV_ID}"
echo "Stack ID: $VERIFY_STACK_ID"
echo "Frontend URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}"
echo "API URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}"
echo "phpMyAdmin URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}/phpmyadmin/"
echo "Portainer Stack URL: ${PORTAINER_URL}/#/stacks"
echo "==========================="