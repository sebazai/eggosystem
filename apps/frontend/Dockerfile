# Stage 1: Build Stage
FROM node:22-slim AS base

FROM base AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy monorepo configurations
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/ ./packages/

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --ignore-scripts --frozen-lockfile

# Copy frontend source code
COPY apps/frontend/ ./apps/frontend/

# Build the frontend for production
RUN pnpm build --filter=frontend

# Stage 2: Run Stage
FROM base AS runner
ENV NODE_ENV=production
RUN apt update && apt upgrade -y
# Create and change to the app directory
WORKDIR /usr/src/app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the built Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

# Expose the port
EXPOSE 3000
ENV PORT=3000

# Start Next.js server
CMD ["node", "./apps/frontend/server.js"]
