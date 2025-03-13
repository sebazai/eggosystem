#!/bin/bash
set -e

# Get environment variables (with defaults if missing)
DB_HOST="${DB_HOST:-eggo-devdb}"
DB_ROOT_USER="root"
DB_ROOT_PASSWORD="${DB_PASSWORD:-dev-pass}"
OLD_DB_TABLE="trades"
OLD_DB_NAME=kana

if [ "$WAIT_FOR_DB" = true ]; then
  echo "Waiting for database to be ready..."
  until mysqladmin ping -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" --silent; do
    sleep 10
  done
  echo "Database is ready!"

  echo "Waiting for database '$OLD_DB_NAME' to exist..."
  until echo "SHOW DATABASES;" | mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" | grep -w "$OLD_DB_NAME" > /dev/null; do
    sleep 5
  done
  echo "Database '$OLD_DB_NAME' detected!"

  echo "Checking if ALTER TABLE has already been applied..."
  until echo "SELECT COLUMN_NAME, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$OLD_DB_NAME' AND TABLE_NAME='trades' AND COLUMN_NAME='id' AND EXTRA LIKE '%auto_increment%';" \
    | mysql -h "$DB_HOST" -u"$DB_ROOT_USER" -p"$DB_ROOT_PASSWORD" "$OLD_DB_NAME" | grep -q "id"; do
    echo "Waiting for ALTER TABLE to be applied..."
    sleep 5
  done
  echo "ALTER TABLE has been applied!"
fi

# Execute the main process (migrations)
exec "$@"
