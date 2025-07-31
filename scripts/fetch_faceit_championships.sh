#!/bin/bash

# Faceit API Championship and League Fetcher
# Fetches championships and leagues for organizer and gets details for ongoing ones

# Configuration
ORGANIZER_ID="a6127018-04f0-419a-ad48-b179f61d7cd3"
BASE_URL="https://open.faceit.com/data/v4"
GAME_ID="cs2"  # Counter-Strike 2 game ID

# Function to load environment variables from .env file
load_env_file() {
    # Get the script directory and navigate to workspace root
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local workspace_root="$(cd "$script_dir/.." && pwd)"
    local env_file="$workspace_root/apps/backend/.env"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Load FACEIT_API_KEY from .env file
    export FACEIT_API_KEY=$(grep "^FACEIT_API_KEY=" "$env_file" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$FACEIT_API_KEY" ]; then
        print_error "FACEIT_API_KEY not found in $env_file"
        exit 1
    fi
    
    print_success "Loaded FACEIT_API_KEY from $env_file"
}

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to make API requests
make_api_request() {
    local endpoint="$1"
    local url="${BASE_URL}${endpoint}"
    
    if [ -z "$FACEIT_API_KEY" ]; then
        print_error "FACEIT_API_KEY not loaded from .env file"
        exit 1
    fi
    
    local response=$(curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        -H "Authorization: Bearer $FACEIT_API_KEY" \
        -H "User-Agent: Kanaliiga-Eggosystem/1.0" \
        "$url")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo "$body"
    else
        print_error "API request failed with status $http_code"
        print_error "URL: $url"
        print_error "Response body: $body"
        return 1
    fi
}

# Function to search for leagues
search_leagues() {
    print_status "Searching for leagues..."
    
    # Search for leagues by game
    local leagues_response=$(make_api_request "/search/leagues?game=$GAME_ID&offset=0&limit=50")
    if [ $? -ne 0 ]; then
        print_warning "Failed to search for leagues"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$leagues_response" | jq empty 2>/dev/null; then
        print_error "Invalid JSON response from league search"
        return 1
    fi
    
    local league_count=$(echo "$leagues_response" | jq -r '.items | length // 0')
    print_status "Found $league_count leagues for game $GAME_ID"
    
    echo "$leagues_response"
}

# Function to get league details
get_league_details() {
    local league_id="$1"
    local league_name="$2"
    
    print_status "Getting details for league: $league_name (ID: $league_id)"
    
    # Get league details
    local details=$(make_api_request "/leagues/$league_id")
    if [ $? -ne 0 ]; then
        print_error "Failed to get league details for $league_id"
        return 1
    fi
    
    # Get seasons for this league
    local seasons=$(make_api_request "/leagues/$league_id/seasons")
    if [ $? -ne 0 ]; then
        print_warning "Failed to get seasons for league $league_id"
        seasons="{}"
    fi
    
    # Combine details and seasons
    local combined=$(jq -s '.[0] * {seasons: .[1]}' <(echo "$details") <(echo "$seasons") 2>/dev/null)
    if [ $? -ne 0 ]; then
        print_warning "Failed to combine league and season data for $league_id"
        combined="$details"
    fi
    
    echo "$combined"
}

# Function to get championship details including teams
get_championship_details() {
    local championship_id="$1"
    local championship_name="$2"
    
    print_status "Getting details for championship: $championship_name (ID: $championship_id)"
    
    # Get championship details
    local details=$(make_api_request "/championships/$championship_id")
    if [ $? -ne 0 ]; then
        print_error "Failed to get championship details for $championship_id"
        return 1
    fi
    
    # Get teams for this championship
    local teams=$(make_api_request "/championships/$championship_id/teams")
    if [ $? -ne 0 ]; then
        print_warning "Failed to get teams for championship $championship_id"
        teams="{}"
    fi
    
    # Get matches for this championship
    local matches=$(make_api_request "/championships/$championship_id/matches")
    if [ $? -ne 0 ]; then
        print_warning "Failed to get matches for championship $championship_id"
        matches="{}"
    fi
    
    # Combine details, teams, and matches
    local combined=$(jq -s '.[0] * {teams: .[1], matches: .[2]}' <(echo "$details") <(echo "$teams") <(echo "$matches") 2>/dev/null)
    if [ $? -ne 0 ]; then
        print_warning "Failed to combine championship data for $championship_id"
        # Fallback to just details and teams
        combined=$(jq -s '.[0] * {teams: .[1]}' <(echo "$details") <(echo "$teams") 2>/dev/null)
        if [ $? -ne 0 ]; then
            combined="$details"
        fi
    fi
    
    echo "$combined"
}

# Function to get player details for a team
get_team_players() {
    local team_id="$1"
    local team_name="$2"
    
    print_status "Getting players for team: $team_name (ID: $team_id)"
    
    local team_details=$(make_api_request "/teams/$team_id")
    if [ $? -ne 0 ]; then
        print_error "Failed to get team details for $team_id"
        return 1
    fi
    
    echo "$team_details"
}

# Main execution
main() {
    # Load environment variables from .env file
    load_env_file
    
    print_status "Starting Faceit championship and match fetcher for organizer: $ORGANIZER_ID"
    
    # Get all championships for the organizer
    print_status "Fetching all championships for organizer..."
    local championships_response=$(make_api_request "/organizers/$ORGANIZER_ID/championships")
    if [ $? -ne 0 ]; then
        print_error "Failed to fetch championships for organizer"
        exit 1
    fi
    
    # Debug: Check if response is valid JSON
    if ! echo "$championships_response" | jq empty 2>/dev/null; then
        print_error "Invalid JSON response from API"
        print_error "Response: $championships_response"
        exit 1
    fi
    
    # Check if response has items
    local item_count=$(echo "$championships_response" | jq -r '.items | length // 0')
    print_status "Found $item_count total championships"
    
    # Extract ongoing championships
    local ongoing_championships=$(echo "$championships_response" | jq -r '.items[] | select(.status == "ongoing") | {id: .championship_id, name: .name, status: .status}' 2>/dev/null)
    
    if [ -z "$ongoing_championships" ]; then
        print_warning "No ongoing championships found for organizer"
        print_status "Available championships:"
        echo "$championships_response" | jq -r '.items[] | "  - \(.name) (Status: \(.status))"'
    else
        print_success "Found ongoing championships"
        
        local championships_details="[]"
        
        # Process each ongoing championship
        echo "$ongoing_championships" | jq -c '.' | while read -r championship; do
            local championship_id=$(echo "$championship" | jq -r '.id')
            local championship_name=$(echo "$championship" | jq -r '.name')
            
            print_status "Processing championship: $championship_name"
            
            # Get championship details with teams and matches
            local championship_details=$(get_championship_details "$championship_id" "$championship_name")
            if [ $? -eq 0 ]; then
                championships_details=$(echo "$championships_details" | jq --argjson details "$championship_details" '. += [$details]')
                print_success "Added championship: $championship_name"
            else
                print_error "Failed to process championship: $championship_name"
            fi
        done
        
        # Save results to file
        local output_file="faceit_championships_$(date +%Y%m%d_%H%M%S).json"
        echo "$championships_details" | jq '.' > "$output_file"
        
        print_success "Results saved to: $output_file"
        print_status "Total championships processed: $(echo "$championships_details" | jq 'length')"
        
        # Display summary
        echo ""
        print_status "=== SUMMARY ==="
        echo "$championships_details" | jq -r '.[] | "  - \(.name) (ID: \(.championship_id))"'
        
        # Show match counts for each championship
        echo ""
        print_status "Match counts per championship:"
        echo "$championships_details" | jq -r '.[] | "  - \(.name): \(.matches.items | length // 0) matches"'
    fi
}

# Check dependencies
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq first."
    exit 1
fi

if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed. Please install curl first."
    exit 1
fi

# Run main function
main "$@" 