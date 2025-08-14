FROM mcr.microsoft.com/devcontainers/javascript-node:22-bullseye
ENV TBLS_VERSION=1.86.1
WORKDIR /workspace

RUN npm install -g typescript
RUN npm install -g pnpm

# Install tbls (database documentation tool)
RUN ARCH=$(dpkg --print-architecture) && \
    curl -o tbls.deb -L https://github.com/k1LoW/tbls/releases/download/v$TBLS_VERSION/tbls_$TBLS_VERSION-1_${ARCH}.deb && \
    dpkg -i tbls.deb