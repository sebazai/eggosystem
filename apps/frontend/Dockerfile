# Stage 1: Build Stage
FROM node:22-slim AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy the shared monorepo package.json and pnpm-lock.yaml
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/ ./packages/

# Install the shared dependencies
RUN pnpm install

# Copy the frontend source code
COPY apps/frontend/ ./apps/frontend/

# # Build the frontend for production
RUN pnpm build --filter=frontend

# # Stage 2: Run Stage
FROM builder AS runner
ENV NODE_ENV=production

# Install pnpm globally
RUN npm install -g pnpm

# # Create and change to the app directory
WORKDIR /app

# # No root on prod
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the built assets from the builder stage
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/static ./

USER nextjs

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000

# Command to run the frontend app
CMD ["pnpm", "start"]