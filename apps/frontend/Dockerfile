# Base image
FROM node:22-slim@sha256:0ae9e80c8c7e7a8fea5bc8e8762e4fd09a7a68c251abf8cf44ea0863efda2bc5 AS base
RUN apt update && apt upgrade -y
WORKDIR /usr/src/app
# Install pnpm globally - do this first as it changes least often
RUN npm install -g pnpm

ENV NODE_ENV=production

# Copy dependency files first - these change less frequently
COPY pnpm-workspace.yaml turbo.json ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/eslint/package.json ./packages/eslint/
COPY packages/shared-msw/package.json ./packages/shared-msw/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/types/package.json ./packages/types/
COPY packages/viewer/package.json ./packages/viewer/

# Builder stage
FROM base AS builder
# Install dependencies first
ARG CI=false
RUN if [ "${CI}" = "true" ]; then \
      pnpm config set registry http://172.17.0.1:4873; \
    fi
RUN pnpm install --frozen-lockfile

# Copy source code - these change more frequently
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/

# Build the frontend for production
ARG NEXT_PUBLIC_API_URL=https://hub.kanaliiga.fi
ARG NEXT_PUBLIC_VIEWER_API_URL=https://cs2d.kanaliiga.fi
ARG NEXT_PUBLIC_CLIENT_API_URL=https://hub.kanaliiga.fi
ARG NEXT_PUBLIC_BASE_PATH
ARG NEXT_PUBLIC_BASE_URL=https://hub.kanaliiga.fi
ARG NEXT_PUBLIC_GIT_SHA
ARG NEXT_PUBLIC_GITLAB_URL
ENV NEXT_PUBLIC_VIEWER_API_URL=${NEXT_PUBLIC_VIEWER_API_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_CLIENT_API_URL=${NEXT_PUBLIC_CLIENT_API_URL}
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}
ENV NEXT_PUBLIC_GITLAB_URL=${NEXT_PUBLIC_GITLAB_URL}
RUN pnpm build --filter=frontend

# Stage 2: Run Stage
FROM base AS runner

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the built Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/apps/frontend/public ./apps/frontend/public

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "./apps/frontend/server.js"]
