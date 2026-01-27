---
name: eggosystem-types
description: Usage patterns for @eggosystem/types package including build requirements and type composition
---

# @eggosystem/types Package

**Type:** Strict rule

## Build Requirement

**CRITICAL**: The `@eggosystem/types` package **MUST be built** with `pnpm build` before types can be imported in frontend/backend apps.

```bash
# When modifying types, ALWAYS build first
cd $(git rev-parse --show-toplevel)/packages/types && pnpm build
```

### Why Build is Required

- Package exports compiled TypeScript from `dist/index.js` and `dist/index.d.ts`
- Changes to source files are not available until built
- Both apps depend on the compiled output, not source files

## Usage Pattern

```typescript
// Import shared types in backend/frontend
import {
  User,
  Match,
  Team,
  FaceitPlayer,
  SteamProfile
} from "@eggosystem/types";
```

## Type Composition Rules

### Database-Based Types

**ALWAYS compose types from `@eggosystem/types/db` interfaces** when creating new types that represent database data.

### Type Composition Patterns

#### 1. Field Selection Pattern (Preferred)

```typescript
// ✅ GOOD: Compose from specific database fields
export interface GamePlayerStats {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  team_id: Team["id"];
  kills: PlayerStats["kills"];
  headshots: PlayerStats["headshots"];
  // ... other specific fields
}
```

#### 2. Extends Pattern (When Selecting All)

```typescript
// ✅ GOOD: When selecting all fields from a table
export interface SeasonWithDetails extends Season {
  // Additional computed fields
  team_count: number;
  is_active: boolean;
}
```

#### 3. Avoid Raw Database Types

```typescript
// ❌ BAD: Don't use raw database types directly
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  // ... manually typed fields
}

// ✅ GOOD: Compose from database types
export interface UserResponse {
  id: User["id"];
  name: User["name"];
  email: User["email"];
}
```

### SQL Query Guidelines

- **Prefer specific field selection**: `SELECT id, name, email FROM users`
- **Avoid SELECT \***: Only use when extending the full interface
- **Compose types from database interfaces**: Ensures type safety and consistency

### Benefits

- **Type Safety**: Database changes automatically propagate to composed types
- **Consistency**: Single source of truth for database field types
- **Maintainability**: Changes to database schema update all dependent types
- **Documentation**: Types serve as living documentation of database structure

## Package Dependencies

### Backend Usage

```json
{
  "dependencies": {
    "@eggosystem/types": "workspace:*"
  }
}
```

### Frontend Usage

```json
{
  "dependencies": {
    "@eggosystem/types": "workspace:*"
  }
}
```

## Development Workflow

1. **Modify types**: Edit in `packages/types/src/`
2. **Build types**: `cd packages/types && pnpm build`
3. **Use in apps**: Import updated types in backend/frontend

## Summary

- **Types package**: Always build before importing
- **Compose types**: From `@eggosystem/types/db` interfaces
- **Avoid SELECT \***: Prefer specific field selection in SQL queries
