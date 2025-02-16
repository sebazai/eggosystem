# Base image
FROM node:22-slim AS base
WORKDIR /usr/src/app
# Copy monorepo things
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
# Copy backend package as well
COPY apps/backend/package.json ./apps/backend/
# Install pnpm globally
RUN npm install -g pnpm 
# Builder stage
FROM base AS builder
COPY packages/ ./packages/
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=backend
# leaner stage, MAKE IT MORE LEAN image
FROM base AS leaner
# set production env
# note: make this more dynamic and useable with dev etc later with dev settings, user ARGS maybe
ARG NODE_ENV=production
# set environment variable
ENV NODE_ENV=${NODE_ENV}
RUN pnpm install --filter=!frontend --prod --frozen-lockfile
# Remove the turbo cache, it is not needed in the final image and makes image leaner
RUN rm -r node_modules/.pnpm/turbo-linux-*
# Finally the runner stage as final stage
FROM node:22-slim AS runner
WORKDIR /usr/src/app
# We need to copy these for backend express etc
COPY --from=leaner --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=leaner --chown=node:node /usr/src/app/apps/backend/node_modules ./apps/backend/node_modules
# Copy app dist
COPY --from=builder --chown=node:node /usr/src/app/apps/backend/dist ./apps/backend/dist
# Do not run as root
USER node

EXPOSE 3001
CMD [ "node", "apps/backend/dist/server.js" ]
