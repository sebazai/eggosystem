#!/bin/bash

# Script to push Faceit webhook data to the backend
# Reads FACEIT_WEBHOOK_API_KEY from apps/backend/.env and prompts for JSON input and base URL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_ENV_FILE="$PROJECT_ROOT/apps/backend/.env"

# Check if backend .env file exists
if [[ ! -f "$BACKEND_ENV_FILE" ]]; then
    print_error "Backend .env file not found at: $BACKEND_ENV_FILE"
    print_status "Please ensure the backend environment file exists with FACEIT_WEBHOOK_API_KEY"
    exit 1
fi

# Read FACEIT_WEBHOOK_API_KEY from backend .env file
FACEIT_WEBHOOK_API_KEY=$(grep "^FACEIT_WEBHOOK_API_KEY=" "$BACKEND_ENV_FILE" | cut -d'=' -f2-)

if [[ -z "$FACEIT_WEBHOOK_API_KEY" ]]; then
    print_error "FACEIT_WEBHOOK_API_KEY not found in $BACKEND_ENV_FILE"
    print_status "Please add FACEIT_WEBHOOK_API_KEY=your_api_key to the backend .env file"
    exit 1
fi

print_success "Found FACEIT_WEBHOOK_API_KEY in backend .env file"

# Prompt for base URL with default
echo
print_status "Enter the base URL for the webhook endpoint (press Enter for localhost:3001):"
read -p "Base URL: " BASE_URL

# Set default if empty
if [[ -z "$BASE_URL" ]]; then
    BASE_URL="localhost:3001"
    print_status "Using default base URL: $BASE_URL"
fi

# Ensure the URL has a protocol
if [[ ! "$BASE_URL" =~ ^https?:// ]]; then
    BASE_URL="https://$BASE_URL"
    print_status "Added https:// protocol: $BASE_URL"
fi

# Construct the webhook URL
WEBHOOK_URL="$BASE_URL/api/v1/faceit/webhook"

print_status "Webhook URL: $WEBHOOK_URL"

# Prompt for JSON input method
echo
print_status "Choose how to provide JSON data:"
print_status "1. Paste JSON directly (recommended for small data)"
print_status "2. Provide path to JSON file"
read -p "Choose option (1 or 2): " JSON_INPUT_METHOD

if [[ "$JSON_INPUT_METHOD" == "2" ]]; then
    # Read from file
    read -p "Enter path to JSON file: " JSON_FILE_PATH
    
    if [[ ! -f "$JSON_FILE_PATH" ]]; then
        print_error "File not found: $JSON_FILE_PATH"
        exit 1
    fi
    
    JSON_DATA=$(cat "$JSON_FILE_PATH")
    print_success "Read JSON from file: $JSON_FILE_PATH"
else
    # Read multi-line JSON input
    print_status "Paste your JSON data below (press Ctrl+D when done, or type 'END' on a new line):"
    print_warning "Example: {\"event\": \"match_created\", \"data\": {...}}"
    
    JSON_DATA=""
    while IFS= read -r line; do
        if [[ "$line" == "END" ]]; then
            break
        fi
        JSON_DATA="$JSON_DATA$line"
    done
fi

if [[ -z "$JSON_DATA" ]]; then
    print_error "No JSON data provided"
    exit 1
fi

# Validate JSON
if ! echo "$JSON_DATA" | jq . >/dev/null 2>&1; then
    print_error "Invalid JSON format"
    print_status "Please provide valid JSON data"
    exit 1
fi

print_success "JSON validation passed"

# Send the webhook
echo
print_status "Sending webhook to: $WEBHOOK_URL"
print_status "JSON data:"
echo "$JSON_DATA" | jq .

# Make the HTTP request
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-api-key: $FACEIT_WEBHOOK_API_KEY" \
    -d "$JSON_DATA" \
    "$WEBHOOK_URL")

# Extract status code and response body
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo
if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
    print_success "Webhook sent successfully! Status: $HTTP_STATUS"
    if [[ -n "$RESPONSE_BODY" ]]; then
        print_status "Response:"
        echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    fi
else
    print_error "Webhook failed! Status: $HTTP_STATUS"
    if [[ -n "$RESPONSE_BODY" ]]; then
        print_status "Error response:"
        echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    fi
    exit 1
fi 