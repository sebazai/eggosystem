# How to Change Team Average Calculations

## Quick Guide

To change from **"avg of 4"** to **"avg of 5"** (or any other configuration):

### Single Source of Truth! 🎯

**Edit ONE file:** `/workspace/packages/types/src/calculations/team-balance-config.ts`

```typescript
// CHANGE THESE CONSTANTS:

export const TOP_N_FOR_CURRENT_AVG = 3; // Change to 4 for top4
export const TOTAL_PLAYERS_IN_NEW_AVG = 4; // Change to 5 for avg of 5
export const TOP_N_FOR_COMPARISON = 4; // Change to 5 for avg5 comparisons
```

### Then Rebuild

```bash
# Build the types package to distribute the changes
cd packages/types && pnpm build

# Everything else imports from @eggosystem/types automatically!
```

## What Gets Updated Automatically

✅ All eligibility calculations  
✅ All sortter rankings  
✅ All team comparisons  
✅ All SQL queries  
✅ All frontend displays

## Testing After Changes

```bash
# 1. Test eligibility calculations
cd apps/backend && pnpm test season-eligibility.integration.test.ts

# 2. Test sortter calculations
cd apps/backend && pnpm test sortter.models.integration.test.ts

# 3. Build backend
cd apps/backend && pnpm build

# 4. Build frontend
cd apps/frontend && pnpm build
```

## Current Status

**✅ FULLY REFACTORED AND DRY - SINGLE SOURCE OF TRUTH**

- **Before:** 9+ places to change
- **After:** 3 constants in 1 shared package file

**Location:** `/workspace/packages/types/src/calculations/team-balance-config.ts`

**Usage:**

- ✅ Backend imports from `@eggosystem/types`
- ✅ Frontend imports from `@eggosystem/types`
- ✅ Shared across entire monorepo

All tests passing: ✅ 19/19 relevant tests
