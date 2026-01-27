FROM mcr.microsoft.com/devcontainers/javascript-node:24-bullseye
ENV TBLS_VERSION=1.86.1
WORKDIR /workspace

RUN npm install -g typescript
RUN npm install -g pnpm@10.27.0

# Install tbls (database documentation tool)
RUN ARCH=$(dpkg --print-architecture) && \
    curl -o tbls.deb -L https://github.com/k1LoW/tbls/releases/download/v$TBLS_VERSION/tbls_$TBLS_VERSION-1_${ARCH}.deb && \
    dpkg -i tbls.deb

# Installed in background
# RUN npx playwright install && npx playwright install-deps

# Install MariaDB client for database setup scripts
# Check if packages are needed before installing
RUN if ! command -v mysql &> /dev/null; then \
        apt-get update && \
        apt-get install -y default-mysql-client && \
        rm -rf /var/lib/apt/lists/*; \
    fi
