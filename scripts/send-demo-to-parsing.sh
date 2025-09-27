#!/bin/bash

# RabbitMQ Test Queue Population Script
# Populates parse_queue with test data for worker development

set -e

# Function to load environment variables from .env files
load_env_config() {
    local env_file=""
    
    # Try to find .env file in backend directory
    if [ -f "apps/backend/.env" ]; then
        env_file="apps/backend/.env"
    elif [ -f ".env" ]; then
        env_file=".env"
    fi
    
    if [ -n "$env_file" ]; then
        echo "📄 Loading configuration from $env_file"
        # Source the env file and export variables
        set -a
        source "$env_file"
        set +a
    else
        echo "📄 No .env file found, using default configuration"
    fi
}

# Load environment configuration
load_env_config

# Configuration with fallbacks
RABBITMQ_HOST="${RABBITMQ_HOST:-eggo-rabbitmq}"
RABBITMQ_PORT="${RABBITMQ_PORT:-5672}"
RABBITMQ_USER="${RABBITMQ_USER:-test}"
RABBITMQ_PASS="${RABBITMQ_PASSWORD:-test}"
RABBITMQ_VHOST="${RABBITMQ_VHOST:-/}"

# Build AMQP URL properly
if [ "$RABBITMQ_VHOST" = "/" ]; then
    AMQP_URL="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT"
else
    AMQP_URL="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/$RABBITMQ_VHOST"
fi

# Queue names based on our architecture
PARSE_QUEUE="parse_queue"
WORK_QUEUE="work_queue"
PARSED_QUEUE="parsed_queue"

# Test data
TEST_GAME_ID="123123"
TEST_DOWNLOAD_URL="https://stats.kanaliiga.fi/testdata/1-94cbcea0-8389-4713-ac9d-e53d04514b29-1-1.dem.gz"
TEST_PRIORITY=1
TEST_SOURCE="test_script"

echo "🐰 Populating RabbitMQ Test Queues"
echo "=================================="
echo "Host: $RABBITMQ_HOST"
echo "Port: $RABBITMQ_PORT"
echo "Username: $RABBITMQ_USER"
echo ""

# Check if amqp-tools is available
if ! command -v amqp-declare-queue &> /dev/null; then
    echo "📦 Installing amqp-tools..."
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y amqp-tools > /dev/null 2>&1
    echo "✅ amqp-tools installed"
fi

# Test connection first
echo "🔗 Testing RabbitMQ connection..."
if ! timeout 5 bash -c "</dev/tcp/$RABBITMQ_HOST/$RABBITMQ_PORT" 2>/dev/null; then
    echo "❌ Cannot connect to RabbitMQ at $RABBITMQ_HOST:$RABBITMQ_PORT"
    exit 1
fi
echo "✅ Connection OK"

# Create/declare all queues
echo ""
echo "📋 Creating queues..."
echo "🔗 Using AMQP URL: $AMQP_URL"

echo ""
echo "   Attempting to create $PARSE_QUEUE..."
if amqp-declare-queue -u "$AMQP_URL" -q "$PARSE_QUEUE" -d; then
    echo "✅ $PARSE_QUEUE created/exists"
else
    echo "❌ Failed to create $PARSE_QUEUE with durability, trying without durability..."
    if amqp-declare-queue -u "$AMQP_URL" -q "$PARSE_QUEUE"; then
        echo "✅ $PARSE_QUEUE created/exists (non-durable)"
    else
        echo "❌ Failed to create $PARSE_QUEUE, trying alternative virtual hosts..."
        
        # Try with explicit vhost specification
        echo "   Trying with explicit vhost '/'..."
        ALT_URL="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT/%2F"
        if amqp-declare-queue -u "$ALT_URL" -q "$PARSE_QUEUE"; then
            echo "✅ $PARSE_QUEUE created with explicit vhost"
            AMQP_URL="$ALT_URL"  # Update URL for later use
        else
            echo "   Trying with no vhost..."
            NO_VHOST_URL="amqp://$RABBITMQ_USER:$RABBITMQ_PASS@$RABBITMQ_HOST:$RABBITMQ_PORT"
            if amqp-declare-queue -u "$NO_VHOST_URL" -q "$PARSE_QUEUE"; then
                echo "✅ $PARSE_QUEUE created with no vhost"
                AMQP_URL="$NO_VHOST_URL"  # Update URL for later use
            else
                echo "   Trying with explicit connection parameters..."
                if amqp-declare-queue --server="$RABBITMQ_HOST" --port="$RABBITMQ_PORT" --username="$RABBITMQ_USER" --password="$RABBITMQ_PASS" -q "$PARSE_QUEUE"; then
                    echo "✅ $PARSE_QUEUE created with explicit parameters"
                    AMQP_URL="$NO_VHOST_URL"  # Use simple URL
                else
                    echo "❌ All methods failed for $PARSE_QUEUE"
                    echo "🔍 Debugging info:"
                    echo "   Host: $RABBITMQ_HOST"
                    echo "   Port: $RABBITMQ_PORT"
                    echo "   User: $RABBITMQ_USER"
                    echo "   Original URL: $AMQP_URL"
                    echo "   Alt URL: $ALT_URL"
                    echo "   No vhost URL: $NO_VHOST_URL"
                    exit 1
                fi
            fi
        fi
    fi
fi

echo ""
echo "   Creating $WORK_QUEUE with working connection..."
if amqp-declare-queue -u "$AMQP_URL" -q "$WORK_QUEUE"; then
    echo "✅ $WORK_QUEUE created/exists"
else
    echo "❌ Failed to create $WORK_QUEUE"
    exit 1
fi

echo ""
echo "   Creating $PARSED_QUEUE with working connection..."
if amqp-declare-queue -u "$AMQP_URL" -q "$PARSED_QUEUE"; then
    echo "✅ $PARSED_QUEUE created/exists"
else
    echo "❌ Failed to create $PARSED_QUEUE"
    exit 1
fi

# Create test message for parse_queue
echo ""
echo "📝 Creating test message..."

# Generate current timestamp in ISO format
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create JSON message
TEST_MESSAGE=$(cat <<EOF
{
  "match_game_id": "$TEST_GAME_ID",
  "download_url": "$TEST_DOWNLOAD_URL",
  "priority": $TEST_PRIORITY,
  "created_at": "$TIMESTAMP",
  "source": "$TEST_SOURCE"
}
EOF
)

echo "📄 Test message content:"
echo "$TEST_MESSAGE"
echo ""

# Publish test message to parse_queue
echo "📤 Publishing test message to $PARSE_QUEUE..."
if echo "$TEST_MESSAGE" | amqp-publish -u "$AMQP_URL" -r "$PARSE_QUEUE" -p -C "application/json"; then
    echo "✅ Test message published successfully"
else
    echo "❌ Failed to publish test message"
    exit 1
fi

# Try to verify message was queued
echo ""
echo "🔍 Verifying message publication..."

# Try to peek at the message without consuming it
if timeout 2 amqp-get -u "$AMQP_URL" -q "$PARSE_QUEUE" -c > /dev/null 2>&1; then
    echo "✅ Message verified in $PARSE_QUEUE"
else
    echo "⚠️  Could not verify message in queue (might still be there)"
fi

echo ""
echo "🎉 Queue setup completed!"
echo "=================================="
echo "✅ All queues created successfully"
echo "✅ Test message published to $PARSE_QUEUE"
echo ""
echo "📋 Test Data Summary:"
echo "   Game ID: $TEST_GAME_ID"
echo "   Download URL: $TEST_DOWNLOAD_URL"
echo "   Priority: $TEST_PRIORITY"
echo "   Source: $TEST_SOURCE"
echo "   Timestamp: $TIMESTAMP"
echo ""
echo "💡 Ready for worker implementation!"
echo "   The worker should consume from: $PARSE_QUEUE"
echo "   And produce to: $WORK_QUEUE"

echo ""
echo "🔗 Connection details for your application:"
echo "   Host: $RABBITMQ_HOST"
echo "   Port: $RABBITMQ_PORT"
echo "   Username: $RABBITMQ_USER"
echo "   Password: $RABBITMQ_PASS"
echo "   AMQP URL: $AMQP_URL"
echo ""
echo "📋 Queue Names:"
echo "   Parse Queue: $PARSE_QUEUE"
echo "   Work Queue: $WORK_QUEUE"
echo "   Parsed Queue: $PARSED_QUEUE" 