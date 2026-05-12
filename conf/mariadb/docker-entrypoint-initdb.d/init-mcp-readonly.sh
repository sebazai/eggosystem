
#!/bin/bash
# Creates mcp_readonly user during MariaDB first-time init (empty data dir).
# Runs inside the MariaDB container; only executed when starting from scratch.
set -e

MCP_READONLY_PASSWORD="${MCP_READONLY_PASSWORD:-$MARIADB_ROOT_PASSWORD}"
DB_NAME="${MARIADB_DATABASE:-kanaliiga}"

mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" <<EOF
CREATE USER IF NOT EXISTS 'mcp_readonly'@'%' IDENTIFIED BY '${MCP_READONLY_PASSWORD}';
FLUSH PRIVILEGES;

-- Grant SELECT, SHOW VIEW on the main database
GRANT SELECT, SHOW VIEW ON \`${DB_NAME}\`.* TO 'mcp_readonly'@'%';

-- Allow list_databases (MCP server needs to see db list)
GRANT SELECT ON mysql.db TO 'mcp_readonly'@'%';

FLUSH PRIVILEGES;
EOF

echo "mcp_readonly user created successfully."
