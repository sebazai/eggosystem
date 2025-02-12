# Builder stage
FROM node:22-slim AS builder
# Install pnpm globally
RUN npm install -g pnpm
# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/ ./packages/

# Install the shared dependencies
RUN pnpm install

# Copy and build the TypeScript source code
COPY apps/backend/ ./apps/backend/ 
RUN pnpm build --filter=backend

# Production stage
FROM builder AS runner
ENV NODE_ENV=production

USER node

# Create and change to the app directory
WORKDIR /app

# Copy other necessary files (e.g., configuration files)
COPY --from=builder --chown=node:node /usr/src/app/package.json ./

# Copy node_modules from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy built TypeScript code from builder stage
COPY --from=builder /usr/src/app/apps/backend/dist ./dist
# Copy built TypeScript code from builder stage
COPY --from=builder --chown=node:node /usr/src/app/apps/backend/package.json ./dist/
# Copy node_modules from builder stage
COPY --from=builder /usr/src/app/apps/backend/node_modules ./dist/node_modules


# Expose the port
EXPOSE 8080

# Specify the command to run your application
CMD [ "pnpm", "start" ]
