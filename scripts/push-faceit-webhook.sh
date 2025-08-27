#!/bin/bash

# Script to push Faceit webhook data to the backend
# Reads FACEIT_WEBHOOK_API_KEY from apps/backend/.env and prompts for JSON input and base URL
# Can also reprocess webhooks from database by ID range

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

# Function to parse ID range (e.g., "31-90" -> array of 31,32,33...90)
parse_id_range() {
    local range="$1"
    if [[ "$range" =~ ^([0-9]+)-([0-9]+)$ ]]; then
        local start="${BASH_REMATCH[1]}"
        local end="${BASH_REMATCH[2]}"
        
        if [[ "$start" -gt "$end" ]]; then
            print_error "Invalid range: start ($start) cannot be greater than end ($end)"
            return 1
        fi
        
        # Generate sequence of IDs
        local ids=()
        for ((i=start; i<=end; i++)); do
            ids+=("$i")
        done
        echo "${ids[@]}"
    else
        print_error "Invalid ID range format. Use format: start-end (e.g., 31-90)"
        return 1
    fi
}

# Function to connect to database and fetch webhook data
fetch_webhook_from_db() {
    # Send debug output to stderr so it doesn't interfere with JSON output
    print_status "=== ENTERING fetch_webhook_from_db function ===" >&2
    
    local id="$1"
    local db_host="$2"
    local db_port="$3"
    local db_user="$4"
    local db_password="$5"
    local db_name="$6"
    
    print_status "Function entered successfully with ID: $id" >&2
    print_status "Database params: host=$db_host, port=$db_port, user=$db_user, db=$db_name" >&2
    
    # Debug: Compare with the working connection
    print_status "DEBUG: Comparing with main script variables:" >&2
    print_status "  Function db_host: '$db_host'" >&2
    print_status "  Function db_port: '$db_port'" >&2
    print_status "  Function db_user: '$db_user'" >&2
    print_status "  Function db_name: '$db_name'" >&2
    
    # Check if mysql command is available
    print_status "Checking if mysql command is available..." >&2
    if ! command -v mysql >/dev/null 2>&1; then
        print_error "mysql command not found. Please install MySQL client:" >&2
        print_error "  macOS: brew install mysql-client" >&2
        return 1
    fi
    print_status "mysql command found: $(which mysql)" >&2
    
    # Query to fetch webhook data from FaceitWebhooks table (only retry_count = 0)
    local query="SELECT data FROM FaceitWebhooks WHERE id = $id AND retry_count = 0 AND error_details IS NOT NULL"
    print_status "Executing query: $query" >&2
    
    # Skip connection test since initial connection already worked
    print_status "Using hostname that worked in initial test: $db_host" >&2
    
    # Fetch the webhook data with timeout
    print_status "Running MySQL query with 5 second timeout..." >&2
    print_status "Full command: timeout 5 mysql -h'$db_host' -P'$db_port' -u'$db_user' -p'[HIDDEN]' '$db_name' -s -N -e '$query'" >&2
    
    # First test without timeout to see if it works at all
    print_status "Testing query without timeout first..." >&2
    
    # Create a temporary file to capture output
    local temp_file="/tmp/webhook_query_$$"
    print_status "Using temp file: $temp_file" >&2
    
    # Run the query and capture output to file
    print_status "Executing: mysql -h'$db_host' -P'$db_port' -u'$db_user' -p'[HIDDEN]' '$db_name' -s -N -e '$query' > '$temp_file' 2>&1" >&2
    
    if mysql -h"$db_host" -P"$db_port" -u"$db_user" -p"$db_password" "$db_name" -s -N -e "$query" > "$temp_file" 2>&1; then
        print_status "Query executed successfully" >&2
        
        # Filter out MySQL warnings from the result
        local result=$(cat "$temp_file" | grep -v "mysql: \[Warning\]" | grep -v "^$")
        local exit_code=0
        rm -f "$temp_file"
    else
        print_error "Query failed" >&2
        local result=$(cat "$temp_file")
        local exit_code=1
        rm -f "$temp_file"
    fi
    
    print_status "Query execution completed!" >&2
    print_status "MySQL query completed with exit code: $exit_code" >&2
    print_status "Query result length: ${#result}" >&2
    
    if [[ $exit_code -ne 0 ]]; then
        print_error "Failed to fetch webhook data for ID $id from database" >&2
        print_error "MySQL error: $result" >&2
        return 1
    fi
    
    if [[ -z "$result" ]]; then
        print_warning "No webhook data found for ID $id (or retry_count != 0 or error_details IS NULL)" >&2
        return 1
    fi
    
    print_status "Raw result received (first 100 chars): ${result:0:100}..." >&2
    
    # Check if the result looks like valid JSON
    print_status "Validating JSON format..." >&2
    if ! echo "$result" | jq . >/dev/null 2>&1; then
        print_warning "Webhook data for ID $id is not valid JSON" >&2
        print_status "Raw data: $result" >&2
        return 1
    fi
    
    print_status "JSON validation successful" >&2
    echo "$result"
}

# Function to send webhook
send_webhook() {
    local json_data="$1"
    local webhook_url="$2"
    local api_key="$3"
    
    # Validate JSON
    if ! echo "$json_data" | jq . >/dev/null 2>&1; then
        print_error "Invalid JSON format for webhook data"
        return 1
    fi
    
    print_status "Sending webhook to: $webhook_url"
    print_status "JSON data:"
    echo "$json_data" | jq .
    
    # Make the HTTP request
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "x-api-key: $api_key" \
        -d "$json_data" \
        "$webhook_url")
    
    # Extract status code and response body
    local http_status=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | head -n -1)
    
    if [[ "$http_status" -ge 200 && "$http_status" -lt 300 ]]; then
        print_success "Webhook sent successfully! Status: $http_status"
        if [[ -n "$response_body" ]]; then
            print_status "Response:"
            echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
        fi
        return 0
    else
        print_error "Webhook failed! Status: $http_status"
        if [[ -n "$response_body" ]]; then
            print_status "Error response:"
            echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
        fi
        return 1
    fi
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
    # Use HTTP for localhost, HTTPS for other URLs
    if [[ "$BASE_URL" =~ ^localhost ]]; then
        BASE_URL="http://$BASE_URL"
        print_status "Added http:// protocol for localhost: $BASE_URL"
    else
        BASE_URL="https://$BASE_URL"
        print_status "Added https:// protocol: $BASE_URL"
    fi
fi

    # Construct the webhook URL
    WEBHOOK_URL="$BASE_URL/api/v1/faceit/webhook"

    print_status "Webhook URL: $WEBHOOK_URL"
    
    # Test API connectivity before proceeding
    echo
    print_status "Testing API connectivity..."
    print_status "Testing connection to: $WEBHOOK_URL"
    
    # Test with a simple GET request to see if the server is reachable
    if command -v curl >/dev/null 2>&1; then
        print_status "Testing server reachability..."
        if curl -s --connect-timeout 5 --max-time 10 "$BASE_URL" >/dev/null 2>&1; then
            print_success "API server is reachable"
        else
            print_warning "API server is not reachable at $BASE_URL"
            print_status "Make sure your backend server is running (pnpm run dev in apps/backend)"
        fi
    fi

# Prompt for operation mode
echo
print_status "Choose operation mode:"
print_status "1. Send new webhook data (JSON input)"
print_status "2. Reprocess webhooks from database by ID range (retry_count = 0 and error_details IS NOT NULL only)"
read -p "Choose option (1 or 2): " OPERATION_MODE

if [[ "$OPERATION_MODE" == "2" ]]; then
    # Database reprocessing mode
    print_status "Database reprocessing mode selected"
    
    # Database connection details
    echo
    print_status "Database connection details:"
    print_status "Note: For Docker/containerized databases, use the container name or IP"
    
    # Offer to check Docker containers
    read -p "Check running Docker containers for database? (y/N): " CHECK_DOCKER
    if [[ "$CHECK_DOCKER" == "y" || "$CHECK_DOCKER" == "Y" ]]; then
        print_status "Checking Docker containers..."
        if command -v docker >/dev/null 2>&1; then
            docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}" | grep -E "(mysql|mariadb|3306)" || print_warning "No MySQL/MariaDB containers found"
        else
            print_warning "Docker command not found"
        fi
        echo
    fi
    
    read -p "Database host (press Enter for eggo-devdb): " DB_HOST
    DB_HOST=${DB_HOST:-eggo-devdb}
    
    read -p "Database port (press Enter for 3306): " DB_PORT
    DB_PORT=${DB_PORT:-3306}
    
    read -p "Database name (press Enter for kanaliiga): " DB_NAME
    DB_NAME=${DB_NAME:-kanaliiga}
    
    read -p "Database user (press Enter for root): " DB_USER
    DB_USER=${DB_USER:-root}
    
    read -p "Database password (press Enter for dev-pass): " DB_PASSWORD
    DB_PASSWORD=${DB_PASSWORD:-dev-pass}
    
    # Only show the password prompt if user wants to change it
    if [[ "$DB_PASSWORD" == "dev-pass" ]]; then
        echo "Using default password: dev-pass"
    else
        read -s -p "Enter custom password: " DB_PASSWORD
        echo
    fi
    
    # Show connection details for verification
    echo
    print_status "Connection details:"
    print_status "Host: $DB_HOST"
    print_status "Port: $DB_PORT"
    print_status "Database: $DB_NAME"
    print_status "User: $DB_USER"
    print_status "Password: [hidden]"
    
    # Test database connection with fallback hostnames
    print_status "Testing database connection..."
    print_status "Attempting to connect to $DB_HOST:$DB_PORT/$DB_NAME as $DB_USER..."
    
    # Try the provided hostname first
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
        print_success "Database connection successful with: $DB_HOST"
    else
        print_warning "Connection failed with: $DB_HOST"
        
        # Try with simplified hostname
        simple_host="eggo-devdb"
        print_status "Trying with simplified hostname: $simple_host"
        if mysql -h"$simple_host" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
            print_success "Database connection successful with: $simple_host"
            DB_HOST="$simple_host"  # Update for the rest of the script
        else
            # Try with actual Docker container name
            docker_host="eggosystem_devcontainer-eggo-devdb-1"
            print_status "Trying with Docker container name: $docker_host"
            if mysql -h"$docker_host" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
                print_success "Database connection successful with: $docker_host"
                DB_HOST="$docker_host"  # Update for the rest of the script
            else
                # Try with localhost (if port is mapped)
                localhost_host="localhost"
                print_status "Trying with localhost (port mapping): $localhost_host"
                if mysql -h"$localhost_host" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
                    print_success "Database connection successful with: $localhost_host"
                    DB_HOST="$localhost_host"  # Update for the rest of the script
                else
                    # Try with Docker Desktop internal hostname
                    docker_internal="host.docker.internal"
                    print_status "Trying with Docker Desktop internal: $docker_internal"
                    if mysql -h"$docker_internal" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" >/dev/null 2>&1; then
                        print_success "Database connection successful with: $docker_internal"
                        DB_HOST="$docker_internal"  # Update for the rest of the script
                    else
                        print_error "Failed to connect to database with all hostnames"
                        echo
                        print_status "Troubleshooting tips:"
                        print_status "1. Check port mapping: docker port eggosystem_devcontainer-eggo-devdb-1"
                        print_status "2. Try connecting from inside the container network"
                        print_status "3. Verify MySQL is accepting external connections"
                        print_status "4. Check if your devcontainer is running and you should run this script from inside it"
                        exit 1
                    fi
                fi
            fi
        fi
    fi
    
    # Check if FaceitWebhooks table exists and show its structure
    print_status "Checking if FaceitWebhooks table exists..."
    if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "DESCRIBE FaceitWebhooks" 2>&1; then
        print_error "FaceitWebhooks table not found in database $DB_NAME"
        exit 1
    fi
    print_success "FaceitWebhooks table found"
        
    # Prompt for ID range
    echo
    print_status "Enter ID range to reprocess (e.g., 31-90):"
    read -p "ID range: " ID_RANGE
    
    if [[ -z "$ID_RANGE" ]]; then
        print_error "ID range is required"
        exit 1
    fi
    
    # Parse ID range
    print_status "Parsing ID range: $ID_RANGE"
    IDS=($(parse_id_range "$ID_RANGE"))
    if [[ $? -ne 0 ]]; then
        exit 1
    fi
    
    print_success "Will reprocess ${#IDS[@]} webhooks (retry_count = 0 and error_details IS NOT NULL only): ${IDS[*]}"
    

    
    # Confirm before proceeding
    echo
    print_warning "This will send ${#IDS[@]} webhooks with retry_count = 0 and error_details to the API. Continue? (y/N)"
    read -p "Continue? " CONFIRM
    
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        print_status "Operation cancelled"
        exit 0
    fi
    
    # Process each webhook
    echo
    print_status "Starting webhook reprocessing..."
    
    SUCCESS_COUNT=0
    FAILED_COUNT=0
    SKIPPED_COUNT=0
    FAILED_IDS=()
    SKIPPED_IDS=()
    
    for id in "${IDS[@]}"; do
        echo
        print_status "Processing webhook ID: $id"
        # Fetch webhook data from database
        print_status "Fetching webhook data for ID $id..."
        
        # Fetch webhook data using command substitution (disable set -e temporarily)
        set +e
        webhook_data=$(fetch_webhook_from_db "$id" "$DB_HOST" "$DB_PORT" "$DB_USER" "$DB_PASSWORD" "$DB_NAME")
        fetch_result=$?
        set -e
        
        print_status "Function call completed"
        print_status "fetch_webhook_from_db returned with exit code: $fetch_result"
        print_status "webhook_data length: ${#webhook_data}"
        
        if [[ $fetch_result -ne 0 ]]; then
            print_warning "Skipping ID $id (no data found, retry_count != 0, or no error_details)"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            SKIPPED_IDS+=("$id")
            continue
        fi
        
        print_status "Successfully fetched webhook data for ID $id"
        
        # Send webhook
        print_status "Sending webhook for ID $id..."
        if send_webhook "$webhook_data" "$WEBHOOK_URL" "$FACEIT_WEBHOOK_API_KEY"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            print_success "Webhook ID $id processed successfully"
        else
            FAILED_COUNT=$((FAILED_COUNT + 1))
            FAILED_IDS+=("$id")
            print_error "Webhook ID $id failed to send"
        fi
        
        # Small delay to avoid overwhelming the API
        sleep 0.5
        
        # Progress update
        processed=$((SUCCESS_COUNT + FAILED_COUNT + SKIPPED_COUNT))
        total=${#IDS[@]}
        print_status "Progress: $processed/$total webhooks processed (Success: $SUCCESS_COUNT, Failed: $FAILED_COUNT, Skipped: $SKIPPED_COUNT)"
    done
    
    # Summary
    echo
    print_status "Reprocessing complete!"
    print_success "Successfully processed: $SUCCESS_COUNT webhooks"
    if [[ $SKIPPED_COUNT -gt 0 ]]; then
        print_warning "Skipped (no data, retry_count != 0, or no error_details): $SKIPPED_COUNT webhooks"
        print_status "Skipped IDs: ${SKIPPED_IDS[*]}"
    fi
    if [[ $FAILED_COUNT -gt 0 ]]; then
        print_error "Failed to process: $FAILED_COUNT webhooks"
        print_status "Failed IDs: ${FAILED_IDS[*]}"
    fi
    
else
    # Original JSON input mode
    print_status "JSON input mode selected"
    
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

    # Send the webhook
    echo
    send_webhook "$JSON_DATA" "$WEBHOOK_URL" "$FACEIT_WEBHOOK_API_KEY"
fi 