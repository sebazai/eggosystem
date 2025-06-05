# Base image
FROM node:22-slim@sha256:ec318fe0dc46b56bcc1ca42a202738aeb4f3e347a7b4dd9f9f1df12ea7aa385a AS base
RUN apt update && apt upgrade -y
WORKDIR /usr/src/app
# Install pnpm globally - do this first as it changes least often
RUN npm install -g pnpm 

# Copy dependency files first - these change less frequently
COPY pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/ ./packages/


# Builder stage
FROM base AS builder
# Install dependencies first - this layer will be cached if package.json files haven't changed
ARG CI=false
RUN if [ "${CI}" = "true" ]; then \
      pnpm config set registry http://172.17.0.1:4873; \
    fi
RUN pnpm install --frozen-lockfile
# Build types first
RUN pnpm build --filter=@eggosystem/types
# Now copy source code - these change more frequently
COPY apps/backend/ ./apps/backend/
RUN pnpm build --filter=backend

# leaner stage, MAKE IT MORE LEAN image
FROM base AS leaner
ENV NODE_ENV=production
RUN pnpm install --filter='!frontend' --prod --frozen-lockfile
# Remove the turbo cache, it is not needed in the final image and makes image leaner
RUN rm -r node_modules/.pnpm/turbo-*

# Finally the runner stage as final stage
FROM base AS runner
# Opentelemetry configuration
ENV OTEL_TRACES_EXPORTER="otlp"
ENV OTEL_METRICS_EXPORTER="otlp"
ENV OTEL_LOGS_EXPORTER="otlp"
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/register"
# OTEL Configs
ENV OTEL_SERVICE_NAME="eggosystem"
ENV OTEL_RESOURCE_ATTRIBUTES="deployment.environment=production,service.namespace=eggosystem,service.name=eggosystem-backend-1"
ENV OTEL_NODE_RESOURCE_DETECTORS="env,host,os,serviceinstance"
ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://172.17.0.1:4317"
ENV OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
# We need to copy these for backend express etc
COPY --from=leaner --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=leaner --chown=node:node /usr/src/app/apps/backend/node_modules ./apps/backend/node_modules
# Copy the types package and its dist folder
COPY --from=builder --chown=node:node /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=node:node /usr/src/app/packages/types/package.json ./packages/types/
# Explicitly make zod available to the types package
RUN npm install -g zod@3.24.2
RUN mkdir -p ./packages/types/node_modules
RUN ln -s /usr/local/lib/node_modules/zod ./packages/types/node_modules/zod
# Copy app dist
COPY --from=builder --chown=node:node /usr/src/app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=node:node /usr/src/app/apps/backend/*.pem ./
# Do not run as root
USER node

EXPOSE 3001
CMD [ "node", "apps/backend/dist/server.js" ]
