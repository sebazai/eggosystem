#!/bin/bash

# populate-kanaelo-queue.sh
# Script to populate kanaelo_calc_queue with sample calculation requests

set -e

# Configuration
RABBITMQ_HOST=${RABBITMQ_HOST:-"eggo-rabbitmq"}
RABBITMQ_PORT=${RABBITMQ_PORT:-"5672"}
RABBITMQ_USER=${RABBITMQ_USER:-"test"}
RABBITMQ_PASS=${RABBITMQ_PASS:-"test"}
RABBITMQ_VHOST=${RABBITMQ_VHOST:-"%2F"}
QUEUE_NAME="kanaelo_calc_queue"
SEASON_ID=${SEASON_ID:-"14"}  # Default season, can be overridden

# Sample Steam IDs
STEAM_IDS=(
    "76561197963921578"
    "76561197967885016" 
    "76561198001857963"
    "76561198030886203"
    "76561198043033465"
    "76561198049745649"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐰 Kanaelo Queue Population Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo "RabbitMQ Host: $RABBITMQ_HOST:$RABBITMQ_PORT"
echo "Queue: $QUEUE_NAME"
echo "Season ID: $SEASON_ID"
echo "Steam IDs to process: ${#STEAM_IDS[@]}"
echo ""

# Check if amqp-tools is available
if ! command -v amqp-declare-queue &> /dev/null; then
    echo -e "${YELLOW}📦 Installing amqp-tools...${NC}"
    apt-get update > /dev/null 2>&1
    apt-get install -y amqp-tools > /dev/null 2>&1
    echo -e "${GREEN}✅ amqp-tools installed${NC}"
fi

# Function to create and publish message
publish_calculation_request() {
    local steam_id=$1
    local request_id="calc-req-$(date +%s)-${steam_id: -6}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Create JSON message
    local message=$(cat <<EOF
{
    "steam_id": "$steam_id",
    "season_id": "$SEASON_ID", 
    "timestamp": "$timestamp",
    "request_id": "$request_id",
    "priority": 5,
    "metadata": {
        "trigger": "manual_calculation",
        "requested_by": "populate-script",
        "batch_id": "test-batch-$(date +%s)"
    }
}
EOF
    )
    
    echo -e "${YELLOW}📤 Publishing for Steam ID: $steam_id${NC}"
    echo "   Request ID: $request_id"
    
    # Publish message to queue using amqp-publish
    echo "$message" | amqp-publish \
        --url="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/$RABBITMQ_VHOST" \
        --routing-key="$QUEUE_NAME" \
        --persistent \
        --content-type="application/json" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ Published successfully${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Failed to publish${NC}"
        return 1
    fi
}

# Function to check queue status (simplified)
check_queue_status() {
    echo -e "\n${BLUE}📊 Queue status check...${NC}"
    echo "Queue: $QUEUE_NAME"
    echo -e "${YELLOW}💡 Use RabbitMQ management UI at http://$RABBITMQ_HOST:15672 for detailed queue status${NC}"
}

# Function to declare queue if it doesn't exist
declare_queue() {
    echo -e "${BLUE}📋 Declaring queue: $QUEUE_NAME${NC}"
    
    amqp-declare-queue \
        --url="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/$RABBITMQ_VHOST" \
        --queue="$QUEUE_NAME" \
        --durable >/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Queue declared successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Queue may already exist or declaration failed${NC}"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --season-id ID     Set season ID (default: $SEASON_ID)"
    echo "  --host HOST        RabbitMQ host (default: $RABBITMQ_HOST)"
    echo "  --port PORT        RabbitMQ port (default: $RABBITMQ_PORT)"
    echo "  --user USER        RabbitMQ username (default: $RABBITMQ_USER)"
    echo "  --password PASS    RabbitMQ password (default: $RABBITMQ_PASS)"
    echo "  --help             Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  SEASON_ID, RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASS"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use defaults"
    echo "  $0 --season-id 15                    # Use season 15"
    echo "  SEASON_ID=15 $0                      # Use environment variable"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --season-id)
            SEASON_ID="$2"
            shift 2
            ;;
        --host)
            RABBITMQ_HOST="$2"
            shift 2
            ;;
        --port)
            RABBITMQ_PORT="$2"
            shift 2
            ;;
        --user)
            RABBITMQ_USER="$2"
            shift 2
            ;;
        --password)
            RABBITMQ_PASS="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting queue population...${NC}\n"
    
    # Check initial queue status
    check_queue_status
    
    # Declare queue
    declare_queue
    
    echo ""
    
    # Publish messages for each Steam ID
    local success_count=0
    local total_count=${#STEAM_IDS[@]}
    
    for steam_id in "${STEAM_IDS[@]}"; do
        if publish_calculation_request "$steam_id"; then
            ((success_count++))
        fi
        echo ""
        sleep 1  # Small delay between publications
    done
    
    # Final status
    echo -e "${BLUE}📊 Publication Summary${NC}"
    echo -e "${BLUE}=====================${NC}"
    echo "Total Steam IDs: $total_count"
    echo -e "Successful: ${GREEN}$success_count${NC}"
    echo -e "Failed: ${RED}$((total_count - success_count))${NC}"
    
    # Check final queue status
    check_queue_status
    
    if [ $success_count -eq $total_count ]; then
        echo -e "\n${GREEN}🎉 All messages published successfully!${NC}"
        echo -e "${GREEN}The CSRankker service should now process these calculation requests.${NC}"
    else
        echo -e "\n${YELLOW}⚠️  Some messages failed to publish. Check RabbitMQ connection.${NC}"
    fi
}

# No cleanup needed with amqp-tools

# Run main function
main 