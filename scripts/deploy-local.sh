#!/bin/bash
set -e

# Default to non-verbose mode
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Check if PORTAINER_TOKEN is set
if [ -z "$PORTAINER_TOKEN" ]; then
  echo "Error: PORTAINER_TOKEN environment variable must be set"
  echo "Please export your Portainer API token first:"
  echo "export PORTAINER_TOKEN=your_portainer_api_token"
  exit 1
fi

# Set environment variables for local testing
export ENV_ID="mr-local"
export PORTAINER_URL="https://portainer.kanaliiga.fi"
export HUBDEV_PUBLIC_URL="hubdev.kanaliiga.fi"
export DB_ONDEMAND_ROOT_PASSWORD="dev-pass"
export DB_ONDEMAND_PASSWORD="dev-pass"
export STEAM_API_KEY="your_steam_api_key"  # Replace with actual key if needed
export FACEIT_API_EKY="your_faceit_api_key" # Replace with actual key if needed

# Check if PHPMYADMIN_AUTH is set, if not, create a default one
if [ -z "$PHPMYADMIN_AUTH" ]; then
  echo "PHPMYADMIN_AUTH not set, using default value"
  # Default is admin:admin in htpasswd format
  export PHPMYADMIN_AUTH="admin:$apr1$rqeehqn7$CiJHBGjzXlzLODjnXr5Cj0"
fi

# Create a temporary docker-compose file
echo "Creating temporary docker-compose file..."
cat > docker-compose.local.yml << EOF
version: '3.8'
services:
  backend-${ENV_ID}:
    image: registry.gitlab.com/kanaliiga_public/kanahub/eggosystem/eggo-backend:latest
    depends_on:
      - eggo-redis-${ENV_ID}
    environment:
      NODE_ENV: production
      DB_HOST: eggo-devdb-${ENV_ID}
      DB_USER: "ondemand_${ENV_ID}"
      DB_PASSWORD: "${DB_ONDEMAND_PASSWORD}"
      DB_NAME: kanaliiga
      DB_PORT: 3306
      BASE_PATH: "/${ENV_ID}"
      FRONTEND_URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}
      REDIS_HOST: eggo-redis-${ENV_ID}
      REDIS_PORT: 6379
      STEAM_API_KEY: $STEAM_API_KEY
      FACEIT_API_KEY: $FACEIT_API_KEY
    networks:
      web:
        aliases:
          - hubbe-${ENV_ID}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.hubbe-${ENV_ID}.entrypoints=http"
      - "traefik.http.routers.hubbe-${ENV_ID}.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}\`)"
      - "traefik.http.middlewares.hubbe-${ENV_ID}-strip.stripprefix.prefixes=/${ENV_ID}"
      - "traefik.http.routers.hubbe-${ENV_ID}.middlewares=hubbe-${ENV_ID}-strip"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.entrypoints=https"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}\`)"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.middlewares=hubbe-${ENV_ID}-strip"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.tls=true"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.tls.domains[0].main=${HUBDEV_PUBLIC_URL}"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.tls.certresolver=http"
      - "traefik.http.routers.hubbe-${ENV_ID}-secure.service=hubbe-${ENV_ID}"
      - "traefik.http.services.hubbe-${ENV_ID}.loadbalancer.server.port=3001"
      - "traefik.docker.network=web"

  frontend-${ENV_ID}:
    image: registry.gitlab.com/kanaliiga_public/kanahub/eggosystem/eggo-frontend:latest
    depends_on:
      - backend-${ENV_ID}
    environment:
      NEXT_PUBLIC_API_URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}
      NEXT_PUBLIC_CLIENT_API_URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}
      NEXT_PUBLIC_BASE_PATH: /${ENV_ID}
      NEXT_PUBLIC_BASE_URL: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}
    networks:
      web:
        aliases:
          - kanahub-${ENV_ID}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.kanahub-${ENV_ID}.entrypoints=http"
      - "traefik.http.routers.kanahub-${ENV_ID}.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}\`)"
      - "traefik.http.middlewares.kanahub-${ENV_ID}-strip.stripprefix.prefixes=/${ENV_ID}"
      - "traefik.http.routers.kanahub-${ENV_ID}.middlewares=kanahub-${ENV_ID}-strip"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.entrypoints=https"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}\`)"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.middlewares=kanahub-${ENV_ID}-strip"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.tls=true"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.tls.domains[0].main=${HUBDEV_PUBLIC_URL}"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.tls.certresolver=http"
      - "traefik.http.routers.kanahub-${ENV_ID}-secure.service=kanahub-${ENV_ID}"
      - "traefik.http.services.kanahub-${ENV_ID}.loadbalancer.server.port=3000"
      - "traefik.docker.network=web"

  eggo-ondemand-db-${ENV_ID}:
    image: bitnami/mariadb:11.4.2
    restart: always
    container_name: eggo-devdb-${ENV_ID}
    environment:
      MARIADB_ROOT_PASSWORD: "${DB_ONDEMAND_ROOT_PASSWORD}"
      MARIADB_USER: "ondemand_${ENV_ID}"
      MARIADB_PASSWORD: "${DB_ONDEMAND_PASSWORD}"
      MARIADB_DATABASE: kanaliiga
    networks:
      - web
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p\${MARIADB_ROOT_PASSWORD}"]
      timeout: 20s
      retries: 10
    volumes:
      - ./conf/mariadb/my.cnf:/opt/bitnami/mariadb/conf/my.cnf

  eggo-redis-${ENV_ID}:
    image: redis:7-alpine
    restart: always
    container_name: eggo-redis-${ENV_ID}
    networks:
      - web

  migrations-${ENV_ID}:
    image: registry.gitlab.com/kanaliiga_public/kanahub/eggosystem/eggo-migrations:mr-47
    depends_on:
      - eggo-ondemand-db-${ENV_ID}
    environment:
      NODE_ENV: production
      DB_HOST: eggo-devdb-${ENV_ID}
      DB_USER: "ondemand_${ENV_ID}"
      DB_PASSWORD: "${DB_ONDEMAND_PASSWORD}"
      DB_NAME: kanaliiga
      DB_PORT: 3306
    command: pnpm --filter=backend migrate
    networks:
      - web

  seed-${ENV_ID}:
    image: registry.gitlab.com/kanaliiga_public/kanahub/eggosystem/eggo-migrations:mr-47
    depends_on:
      - migrations-${ENV_ID}
    environment:
      NODE_ENV: production
      DB_HOST: eggo-devdb-${ENV_ID}
      DB_USER: "ondemand_${ENV_ID}"
      DB_PASSWORD: "${DB_ONDEMAND_PASSWORD}"
      DB_NAME: kanaliiga
      DB_PORT: 3306
    command: pnpm -filter=backend seed
    networks:
      - web

  phpmyadmin-${ENV_ID}:
    image: phpmyadmin/phpmyadmin:latest
    container_name: phpmyadmin-${ENV_ID}
    depends_on:
      - eggo-ondemand-db-${ENV_ID}
    environment:
      PMA_HOST: eggo-devdb-${ENV_ID}
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: "${DB_ONDEMAND_ROOT_PASSWORD}"
      PMA_ABSOLUTE_URI: https://${HUBDEV_PUBLIC_URL}/${ENV_ID}/phpmyadmin/
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}.entrypoints=http"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}/phpmyadmin\`)"
      - "traefik.http.middlewares.hubphpmyadmin-${ENV_ID}-https-redirect.redirectscheme.scheme=https"
      - "traefik.http.middlewares.hubphpmyadmin-${ENV_ID}-stripprefix.stripprefix.prefixes=/${ENV_ID}/phpmyadmin"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}.middlewares=hubphpmyadmin-${ENV_ID}-https-redirect"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.entrypoints=https"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.rule=Host(\`${HUBDEV_PUBLIC_URL}\`) && PathPrefix(\`/${ENV_ID}/phpmyadmin\`)"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.tls=true"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.tls.domains[0].main=${HUBDEV_PUBLIC_URL}"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.priority=100"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}.priority=100"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.middlewares=hubphpmyadmin-${ENV_ID}-stripprefix"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.tls.certresolver=http"
      - "traefik.http.routers.hubphpmyadmin-${ENV_ID}-secure.service=hubphpmyadmin-${ENV_ID}"
      - "traefik.http.services.hubphpmyadmin-${ENV_ID}.loadbalancer.server.port=80"
      - "traefik.docker.network=web"

networks:
  web:
    external: true
    name: web
EOF

echo "Running deploy-to-portainer.sh with local configuration..."
if [ "$VERBOSE" = true ]; then
  bash "$(dirname "$0")/deploy-to-portainer.sh" --verbose docker-compose.local.yml
else
  bash "$(dirname "$0")/deploy-to-portainer.sh" docker-compose.local.yml
fi

# Clean up
echo "Cleaning up temporary files..."
rm -f docker-compose.local.yml

echo "Local deployment test completed" 