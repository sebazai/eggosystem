#!/bin/bash
set -o pipefail

while true; do
  SECONDS_UNTIL_0400=$(( ( (4*3600) - ($(date -u +%s) % 86400) + 86400 ) % 86400 ))
  echo "Next backup in ${SECONDS_UNTIL_0400}s at 04:00 UTC"
  sleep "${SECONDS_UNTIL_0400}"
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "Starting backup ${NOW}"
  if mariadb-dump -h eggo-prod-db -u root -p"${MARIADB_ROOT_PASSWORD}" --all-databases | gzip > /db/db_backup_${NOW}.tgz; then
    echo "Backup done: db_backup_${NOW}.tgz"
  else
    echo "Backup FAILED"
    rm -f "/db/db_backup_${NOW}.tgz"
  fi
  find /db -name "db_backup_*.tgz" -mmin +10080 -delete
done
