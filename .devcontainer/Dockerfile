FROM mcr.microsoft.com/devcontainers/javascript-node:24-bullseye
ENV TBLS_VERSION=1.92.3
WORKDIR /workspace

RUN npm install -g typescript
RUN npm install -g pnpm@10.27.0

# Install tbls (database documentation tool)
RUN ARCH=$(dpkg --print-architecture) && \
    curl -o tbls.deb -L https://github.com/k1LoW/tbls/releases/download/v$TBLS_VERSION/tbls_$TBLS_VERSION-1_${ARCH}.deb && \
    dpkg -i tbls.deb

# Installed in background
# RUN npx playwright install chromium && npx playwright install-deps chromium

# Install uv (standalone) so MariaDB MCP server can start before postCreateCommand/postStartCommand run
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/local/bin" UV_NO_MODIFY_PATH=1 sh

# Clone and set up MariaDB MCP server at build time so it is ready before postCreateCommand/postStartCommand.
# uv stores managed Python in $HOME/.local/share/uv/python. If we run uv sync as root, the venv's
# python3 symlink points into /root/.local/..., and at runtime the MCP (running as node) gets
# "Permission denied" when resolving that path. So we run uv sync as node so all paths are under
# /home/node and the runtime user can access them.
RUN apt-get update && apt-get install -y --no-install-recommends git xvfb xauth && rm -rf /var/lib/apt/lists/* && \
    git clone --depth 1 https://github.com/MariaDB/mcp.git /usr/local/mariadb-mcp && \
    chown -R node:node /usr/local/mariadb-mcp
USER node
RUN cd /usr/local/mariadb-mcp && uv sync
USER root
