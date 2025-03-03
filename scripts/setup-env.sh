#!/bin/bash

echo "Environment files have been set up!" 

# Run migrations & seed
pnpm --filter=backend migrate
pnpm --filter=backend seed
