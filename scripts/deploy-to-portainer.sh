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

# Function to handle stack creation with error handling for normalized name conflicts
create_stack() {
  local STACK_NAME="$1"
  local COMPOSE_CONTENT_ESCAPED="$2"
  local TMP_COMPOSE_FILE="$3"
  
  echo "Creating stack with name: $STACK_NAME"
  
  CREATE_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/stacks/create/standalone/string?endpointId=${ENDPOINT_ID}" \
    -H "X-API-Key: ${PORTAINER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${STACK_NAME}\",
      \"stackFileContent\": ${COMPOSE_CONTENT_ESCAPED}
    }")
  
  CREATE_STATUS=$?
  if [ "$VERBOSE" = true ]; then
    debug "Create stack status code: $CREATE_STATUS"
    debug "Create stack response: $(echo "$CREATE_RESPONSE" | jq 2>/dev/null || echo "$CREATE_RESPONSE")"
  fi
  
  # Extract the stack ID from the response
  STACK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.Id // empty' 2>/dev/null || echo "")
  
  # Check for specific error message about normalized name already existing
  if [[ "$CREATE_RESPONSE" == *"normalized name"*"already exists"* ]]; then
    echo "Error: A stack with this normalized name already exists in Portainer."
    echo "Trying to force delete any remaining stacks with similar names..."
    
    # Get list of all stacks
    ALL_STACKS=$(curl -s "${PORTAINER_URL}/api/stacks" -H "X-API-Key: ${PORTAINER_TOKEN}")
    
    # Try to find stacks with similar names - broader search
    SIMILAR_STACKS=$(echo "$ALL_STACKS" | jq -r '[.[] | select(.Name | contains("'"${ENV_ID}"'"))]')
    
    SIMILAR_STACK_COUNT=$(echo "$SIMILAR_STACKS" | jq -r 'length')
    if [ "$SIMILAR_STACK_COUNT" -gt 0 ]; then
      echo "Found $SIMILAR_STACK_COUNT similar stack(s) that might be causing conflicts"
      
      # Extract IDs of similar stacks and delete them
      SIMILAR_STACK_IDS=$(echo "$SIMILAR_STACKS" | jq -r '.[].Id')
      for SID in $SIMILAR_STACK_IDS; do
        echo "Forcefully deleting stack with ID: $SID"
        curl -s -X DELETE "${PORTAINER_URL}/api/stacks/${SID}?endpointId=${ENDPOINT_ID}&external=false" -H "X-API-Key: ${PORTAINER_TOKEN}"
      done
      
      echo "Waiting 20 seconds after forced deletion..."
      sleep 20
      
      # Try creating the stack again with a slightly modified name
      echo "Retrying stack creation with a modified name..."
      TIMESTAMP=$(date +%s)
      
      CREATE_RESPONSE=$(curl -s -X POST "${PORTAINER_URL}/api/stacks/create/standalone/string?endpointId=${ENDPOINT_ID}" \
        -H "X-API-Key: ${PORTAINER_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
          \"name\": \"eggosystem-${ENV_ID}-${TIMESTAMP}\",
          \"stackFileContent\": ${COMPOSE_CONTENT_ESCAPED}
        }")
      
      CREATE_STATUS=$?
      STACK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.Id // empty' 2>/dev/null || echo "")
      
      if [ $CREATE_STATUS -ne 0 ] || [ -z "$STACK_ID" ] || [ "$STACK_ID" = "null" ]; then
        echo "Stack creation failed even with modified name."
        echo "Error response from Portainer: $(echo "$CREATE_RESPONSE" | jq -r '.message // .err // empty' 2>/dev/null || echo "$CREATE_RESPONSE")"
        rm -f "$TMP_COMPOSE_FILE"
        return 1
      else
        echo "Stack created successfully with modified name and ID: $STACK_ID"
        return 0
      fi
    else
      echo "No similar stacks found. The issue might be internal to Portainer."
      echo "Please try manually deleting any stacks via the Portainer UI and try again."
      rm -f "$TMP_COMPOSE_FILE"
      return 1
    fi
  elif [ $CREATE_STATUS -ne 0 ] || [ -z "$STACK_ID" ] || [ "$STACK_ID" = "null" ]; then
    echo "Stack creation failed."
    echo "Error response from Portainer: $(echo "$CREATE_RESPONSE" | jq -r '.message // .err // empty' 2>/dev/null || echo "$CREATE_RESPONSE")"
    return 1
  else
    echo "Stack created successfully with ID: $STACK_ID"
    return 0
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

# Function to delete an image by name and tag
delete_image() {
  local IMAGE_NAME="$1"
  local TAG="${2:-${ENV_ID}}"  # Use provided tag or default to ENV_ID
  local FULL_IMAGE_NAME="registry.gitlab.com/kanaliiga_public/kanahub/eggosystem/${IMAGE_NAME}:${TAG}"
  echo "Attempting to delete image: $FULL_IMAGE_NAME"
  
  # Use the Docker v1.41 API to delete the image
  DELETE_RESPONSE=$(curl -s -X DELETE "${PORTAINER_URL}/api/endpoints/${ENDPOINT_ID}/docker/v1.41/images/${FULL_IMAGE_NAME}?force=true" \
    -H "X-API-Key: ${PORTAINER_TOKEN}")
  
  # Check if the deletion was successful
  if [[ "$DELETE_RESPONSE" == *"error"* ]]; then
    echo "Warning: Error deleting image: $DELETE_RESPONSE"
    return 1
  else
    echo "Successfully deleted image: $FULL_IMAGE_NAME"
    return 0
  fi
}

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

# Check if stack already exists - check both by name and normalized name
echo "Checking if stack already exists..."
STACKS=$(curl -s "${PORTAINER_URL}/api/stacks" -H "X-API-Key: ${PORTAINER_TOKEN}")
if [ "$VERBOSE" = true ]; then
  debug "Available stacks: $(echo "$STACKS" | jq 2>/dev/null || echo "$STACKS")"
fi

# Find stacks with our ENV_ID in the name (might be multiple)
MATCHING_STACKS=$(echo "$STACKS" | jq -r '.[] | select(.Name | contains("eggosystem-'"${ENV_ID}"'")) | .Id')

if [ -z "$MATCHING_STACKS" ]; then
  echo "No stack exists, creating new stack"
  
  # Delete images first if they exist
  for IMAGE_NAME in "eggo-backend" "eggo-frontend" "eggo-migrations"; do
    delete_image "$IMAGE_NAME" "${ENV_ID}"
  done
  
  # Create the stack with compose file content
  TMP_COMPOSE_FILE=$(mktemp)
  echo "$COMPOSE_CONTENT" > "$TMP_COMPOSE_FILE"
  COMPOSE_CONTENT_ESCAPED=$(echo "$COMPOSE_CONTENT" | jq -Rs .)
  
  # Function to handle stack creation with error handling for normalized name conflicts
  if ! create_stack "eggosystem-${ENV_ID}" "$COMPOSE_CONTENT_ESCAPED" "$TMP_COMPOSE_FILE"; then
    # Clean up temporary file
    rm -f "$TMP_COMPOSE_FILE"
    exit 1
  fi
  
  # Clean up temporary file
  rm -f "$TMP_COMPOSE_FILE"
else
  # One or more stacks exist, delete them all and recreate
  echo "Found existing stack(s), deleting and recreating"
  
  # Loop through each stack ID and delete it
  for STACK_ID in $(echo "$MATCHING_STACKS" | jq -r '.[].Id'); do
    echo "Deleting stack with ID: $STACK_ID"
    DELETE_RESPONSE=$(curl -s -X DELETE "${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}&external=false" \
      -H "X-API-Key: ${PORTAINER_TOKEN}")
    
    DELETE_STATUS=$?
    if [ "$VERBOSE" = true ]; then
      debug "Delete stack status code: $DELETE_STATUS"
      debug "Delete stack response: $(echo "$DELETE_RESPONSE" | jq 2>/dev/null || echo "$DELETE_RESPONSE")"
    fi
    
    if [ $DELETE_STATUS -ne 0 ]; then
      echo "WARNING: Failed to delete stack with ID: $STACK_ID, status: $DELETE_STATUS"
      echo "Response: $(echo "$DELETE_RESPONSE" | jq -r '.message // .err // empty' 2>/dev/null || echo "$DELETE_RESPONSE")"
    else
      echo "Successfully deleted stack with ID: $STACK_ID"
    fi
  done
  
  # Wait for 20 seconds to ensure stack is completely deleted
  echo "Waiting 20 seconds after stack deletion..."
  sleep 20
  
  # Check if there are still stacks with our ENV_ID
  REMAINING_STACKS=$(curl -s "${PORTAINER_URL}/api/stacks" -H "X-API-Key: ${PORTAINER_TOKEN}" | jq -r '[.[] | select(.Name | contains("'"${ENV_ID}"'"))]')
  REMAINING_COUNT=$(echo "$REMAINING_STACKS" | jq -r 'length')
  
  if [ "$REMAINING_COUNT" -gt 0 ]; then
    echo "WARNING: $REMAINING_COUNT stack(s) with ENV_ID $ENV_ID still exist after deletion attempt"
    echo "Attempting forced deletion of remaining stacks..."
    
    for STACK_ID in $(echo "$REMAINING_STACKS" | jq -r '.[].Id'); do
      echo "Force deleting stack with ID: $STACK_ID"
      curl -s -X DELETE "${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}&external=false" -H "X-API-Key: ${PORTAINER_TOKEN}"
    done
    
    echo "Waiting additional 20 seconds after forced deletion..."
    sleep 20
  fi
  
  # Delete images
  for IMAGE_NAME in "eggo-backend" "eggo-frontend" "eggo-migrations"; do
    delete_image "$IMAGE_NAME" "${ENV_ID}"
  done
  
  # Create the stack with compose file content
  TMP_COMPOSE_FILE=$(mktemp)
  echo "$COMPOSE_CONTENT" > "$TMP_COMPOSE_FILE"
  COMPOSE_CONTENT_ESCAPED=$(echo "$COMPOSE_CONTENT" | jq -Rs .)
  
  # Function to handle stack creation with error handling for normalized name conflicts
  if ! create_stack "eggosystem-${ENV_ID}" "$COMPOSE_CONTENT_ESCAPED" "$TMP_COMPOSE_FILE"; then
    # Clean up temporary file
    rm -f "$TMP_COMPOSE_FILE"
    exit 1
  fi
  
  # Clean up temporary file
  rm -f "$TMP_COMPOSE_FILE"
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