# @eggosystem Packages Usage Rules

**Type:** Strict rule

## @eggosystem/types Package

### Build Requirement

**CRITICAL**: The `@eggosystem/types` package **MUST be built** with `pnpm build` before types can be imported in frontend/backend apps.

```bash
# When modifying types, ALWAYS build first
cd $(git rev-parse --show-toplevel)/packages/types && pnpm build
```

### Usage Pattern

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

### Why Build is Required

- Package exports compiled TypeScript from `dist/index.js` and `dist/index.d.ts`
- Changes to source files are not available until built
- Both apps depend on the compiled output, not source files

## @eggosystem/shared-msw Testing Strategy

### External API Testing Rule

**ALL external API calls MUST be intercepted with MSW** in integration and E2E tests.

### Testing Hierarchy (Priority Order)

1. **MSW First**: Use `@eggosystem/shared-msw` for external API mocking
2. **Playwright Route Interception**: Only for internal routes that can't be mocked with MSW
3. **Never**: Let tests depend on actual external APIs

### Usage in Tests

```typescript
// Backend tests
import {
  mswServer,
  faceitValidSteamId,
  leetifyValidSteamId
} from "@eggosystem/shared-msw";

// E2E tests - prefer MSW over Playwright route interception
import { mswServer } from "@eggosystem/shared-msw";
```

### Available Test Scenarios

- `*ValidSteamId` - Valid API responses
- `*NotFoundSteamId` - 404 errors
- `*NetworkErrorSteamId` - Network failures
- `*RateLimitSteamId` - Rate limiting
- `*InvalidJsonSteamId` - Malformed responses

### Benefits

- **Fast tests**: No network calls
- **Reliable tests**: No external service downtime
- **Comprehensive coverage**: All error scenarios
- **Consistent mocking**: Across unit, integration, and E2E tests

## Package Dependencies

### Backend Usage

```json
{
  "dependencies": {
    "@eggosystem/types": "workspace:*"
  },
  "devDependencies": {
    "@eggosystem/shared-msw": "workspace:*"
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
4. **Write tests**: Use MSW for external API mocking
5. **Run tests**: Ensure MSW intercepts all external calls

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

## Summary

- **Types package**: Always build before importing
- **MSW package**: Use for all external API testing
- **Prefer MSW**: Over Playwright route interception for external APIs
- **Never depend**: On actual external services in tests
- **Compose types**: From `@eggosystem/types/db` interfaces
- **Avoid SELECT \***: Prefer specific field selection in SQL queries
