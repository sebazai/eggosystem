#!/bin/bash

# Copy base env file to root and apps
cp .env.base .env.development
cp .env.base apps/backend/.env.development

echo "Environment files have been set up!" 

# Run migrations & seed
pnpm --filter=backend migrate
pnpm --filter=backend seed
