# Base image
FROM node:22-slim AS base
WORKDIR /usr/src/app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
RUN npm install -g pnpm 
# Builder stage
FROM base AS builder
COPY packages/ ./packages/
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=backend
# runner stage, lean image
FROM base AS runner
ENV  NODE_ENV=production

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist

EXPOSE 3001
CMD [ "node", "apps/backend/dist/server.js" ]