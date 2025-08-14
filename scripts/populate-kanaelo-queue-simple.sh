#!/bin/bash

# populate-kanaelo-queue-simple.sh
# Simple script using amqp-tools to populate kanaelo_calc_queue

# Configuration
RABBITMQ_HOST=${RABBITMQ_HOST:-"eggo-rabbitmq"}
RABBITMQ_PORT=${RABBITMQ_PORT:-"5672"}
RABBITMQ_USER=${RABBITMQ_USER:-"test"}
RABBITMQ_PASS=${RABBITMQ_PASS:-"test"}
RABBITMQ_VHOST=${RABBITMQ_VHOST:-"%2F"}
SEASON_ID=${SEASON_ID:-"14"}

# Steam IDs to process
STEAM_IDS=(
    "76561197963921578"
    "76561197967885016" 
    "76561198001857963"
    "76561198030886203"
    "76561198043033465"
    "76561198049745649"
)

# Check if amqp-tools is available
if ! command -v amqp-publish &> /dev/null; then
    echo "📦 Installing amqp-tools..."
    apt-get update > /dev/null 2>&1
    apt-get install -y amqp-tools > /dev/null 2>&1
    echo "✅ amqp-tools installed"
fi

echo "🐰 Populating kanaelo_calc_queue with ${#STEAM_IDS[@]} Steam IDs..."
echo "Season ID: $SEASON_ID"
echo ""

# Declare queue first
echo "📋 Declaring queue..."
amqp-declare-queue \
    --url="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/$RABBITMQ_VHOST" \
    --queue="kanaelo_calc_queue" \
    --durable >/dev/null

for steam_id in "${STEAM_IDS[@]}"; do
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    request_id="calc-req-$(date +%s)-${steam_id: -6}"
    
    # Create JSON payload
    payload=$(cat <<EOF
{
    "steam_id": "$steam_id",
    "season_id": "$SEASON_ID",
    "timestamp": "$timestamp", 
    "request_id": "$request_id",
    "priority": 5,
    "metadata": {
        "trigger": "manual_calculation",
        "requested_by": "simple-script"
    }
}
EOF
    )
    
    echo "📤 Publishing Steam ID: $steam_id"
    
    # Publish using amqp-publish
    echo "$payload" | amqp-publish \
        --url="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/$RABBITMQ_VHOST" \
        --routing-key="kanaelo_calc_queue" \
        --persistent \
        --content-type="application/json" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success"
    else
        echo "   ❌ Failed"
    fi
    
    sleep 0.5
done

echo ""
echo "🎉 Finished publishing calculation requests!"
echo "Check the CSRankker service logs to see processing." 