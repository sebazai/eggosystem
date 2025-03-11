# Base image
FROM node:22-slim AS base
RUN apt update && apt upgrade -y
WORKDIR /usr/src/app
# Install pnpm globally - do this first as it changes least often
RUN npm install -g pnpm 

# Copy dependency files first - these change less frequently
COPY pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/

# Builder stage
FROM base AS builder
# Install dependencies first - this layer will be cached if package.json files haven't changed
RUN pnpm install --frozen-lockfile
# Now copy source code - these change more frequently
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/
RUN pnpm build --filter=backend

# leaner stage, MAKE IT MORE LEAN image
FROM base AS leaner
ENV NODE_ENV=production
# Copy only the dependency files needed for production
COPY pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/
RUN pnpm install --filter=!frontend --prod --frozen-lockfile
# Remove the turbo cache, it is not needed in the final image and makes image leaner
RUN rm -r node_modules/.pnpm/turbo-*

# Finally the runner stage as final stage
FROM base AS runner
# We need to copy these for backend express etc
COPY --from=leaner --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=leaner --chown=node:node /usr/src/app/apps/backend/node_modules ./apps/backend/node_modules
# Copy app dist
COPY --from=builder --chown=node:node /usr/src/app/apps/backend/dist ./
# Do not run as root
USER node

EXPOSE 3001
CMD [ "node", "apps/backend/server.js" ]
