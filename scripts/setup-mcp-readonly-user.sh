#!/bin/bash
# Don't use set -e here - we want to handle errors gracefully

# Only run in development environment
if [ "$NODE_ENV" = "production" ]; then
  echo "Skipping mcp_readonly user setup - not in development environment"
  exit 0
fi

# Get environment variables (with defaults if missing)
DB_HOST="${DB_HOST:-eggo-devdb}"
DB_PORT="${DB_PORT:-3306}"
DB_ROOT_USER="${DB_ROOT_USER:-root}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-dev-pass}"
MCP_READONLY_PASSWORD="${MCP_READONLY_PASSWORD:-dev-pass}"
DB_NAME="${DB_NAME:-kanaliiga}"

echo "Setting up mcp_readonly user for MariaDB MCP Server..."

# Wait for database to be ready (using same pattern as wait-for-kanadb.sh)
echo "Waiting for database to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0
until mysqladmin ping -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" --silent 2>/dev/null; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "Warning: Database at $DB_HOST:$DB_PORT did not become ready after $MAX_ATTEMPTS attempts"
    echo "Skipping mcp_readonly user setup. You can run this script manually later."
    exit 0
  fi
  echo "Waiting for database at $DB_HOST:$DB_PORT... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done
echo "Database is ready!"

# Check if user already exists (handle errors gracefully)
USER_EXISTS=$(mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" -sN -e "SELECT COUNT(*) FROM mysql.user WHERE User='mcp_readonly' AND Host='%';" 2>/dev/null || echo "0")

# Verify we got a valid response
if [ -z "$USER_EXISTS" ]; then
  USER_EXISTS="0"
fi

if [ "$USER_EXISTS" = "1" ]; then
  echo "User 'mcp_readonly' already exists, updating permissions..."
else
  echo "Creating mcp_readonly user..."
  if ! mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" <<EOF 2>/dev/null
CREATE USER IF NOT EXISTS 'mcp_readonly'@'%' IDENTIFIED BY '$MCP_READONLY_PASSWORD';
FLUSH PRIVILEGES;
EOF
  then
    echo "Error: Failed to create user. Continuing with permission grants..."
  else
    echo "User 'mcp_readonly' created successfully!"
  fi
fi

# Grant read-only permissions
echo "Granting read-only permissions to mcp_readonly user..."

# First, ensure user exists with '%' host pattern
mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" <<EOF
CREATE USER IF NOT EXISTS 'mcp_readonly'@'%' IDENTIFIED BY '$MCP_READONLY_PASSWORD';
FLUSH PRIVILEGES;
EOF

# Check if database exists, create if it doesn't (shouldn't happen, but be safe)
DB_EXISTS=$(mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" -sN -e "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='${DB_NAME}';" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" != "1" ]; then
  echo "Warning: Database '${DB_NAME}' does not exist yet. Creating it..."
  mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
EOF
fi

# Grant permissions
# Note: information_schema and performance_schema are accessible by all users by default in MariaDB
# We only need to grant permissions on user databases
mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" <<EOF
-- Grant SELECT, SHOW, DESCRIBE, EXPLAIN on the main database
GRANT SELECT, SHOW VIEW ON \`${DB_NAME}\`.* TO 'mcp_readonly'@'%';

-- Ensure user can see all databases for list_databases tool (needed for MCP server's list_databases)
GRANT SELECT ON mysql.db TO 'mcp_readonly'@'%';

FLUSH PRIVILEGES;
EOF

GRANT_EXIT=$?
if [ $GRANT_EXIT -eq 0 ]; then
  echo "Permissions granted successfully!"
else
  echo "Warning: Failed to grant permissions (exit code: $GRANT_EXIT)"
  echo "The error message should be displayed above."
  echo "Common issues:"
  echo "  - Database '${DB_NAME}' might not exist (check migrations)"
  echo "  - User might exist with different host pattern"
  echo "You may need to run this script again after migrations complete."
fi

echo "mcp_readonly user setup completed successfully!"
