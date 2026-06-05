FROM mcr.microsoft.com/devcontainers/javascript-node:24-trixie
ENV TBLS_VERSION=1.92.3
WORKDIR /workspace

RUN npm install -g typescript
RUN npm install -g pnpm@10.27.0
RUN npm install -g @anthropic-ai/claude-code

# Install rtk (CLI proxy) into PATH
RUN curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | env RTK_INSTALL_DIR="/usr/local/bin" sh

# Install tbls (database documentation tool)
RUN ARCH=$(dpkg --print-architecture) && \
    curl -o tbls.deb -L https://github.com/k1LoW/tbls/releases/download/v$TBLS_VERSION/tbls_$TBLS_VERSION-1_${ARCH}.deb && \
    dpkg -i tbls.deb

# Installed in background
# RUN npx playwright install chromium && npx playwright install-deps chromium

# Install uv (standalone) so MariaDB MCP server can start before postCreateCommand/postStartCommand run
RUN curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR="/usr/local/bin" UV_NO_MODIFY_PATH=1 sh

# Clone upstream MariaDB MCP at build time; heavy Python deps install at container startup (scripts/install-mariadb-mcp-local-venv.sh).
# Keep MCP tree owned by node; uv-managed Pythons live under /home/node (avoid root-created .venv pointing at /root).
RUN apt-get update && apt-get install -y --no-install-recommends git vim xvfb xauth && rm -rf /var/lib/apt/lists/* && \
    git clone --depth 1 https://github.com/MariaDB/mcp.git /usr/local/mariadb-mcp && \
    chown -R node:node /usr/local/mariadb-mcp

# Managed Python via uv (prebuilt; no devcontainers/features/python gpg keyservers).
# Pins 3.11 for MariaDB MCP venv parity with former feature default.
USER node
ENV PATH="/home/node/.local/bin:${PATH}"
# MariaDB MCP deps (PyTorch etc.) are huge — baking them in Dockerfile slows every image build.
# Install in background after container start: scripts/install-mariadb-mcp-local-venv.sh (see post-start + run-mariadb-mcp.sh).
RUN uv python install 3.11
RUN mkdir -p /home/node/.claude /home/node/.cursor && rtk init -g && rtk init -g --agent cursor
RUN git config --global core.editor vim

# Scripts (e.g. setup-mariadb-mcp-server.sh) expect python3.11 on PATH; uv-managed Pythons live under ~/.local/share/uv.
USER root
RUN PY311="$(su - node -c 'export PATH="/usr/local/bin:$PATH"; uv python find 3.11 --managed-python')" \
    && test -x "$PY311" \
    && ln -sf "$PY311" /usr/local/bin/python3.11
USER node
