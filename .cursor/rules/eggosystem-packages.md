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

## Summary

- **Types package**: Always build before importing
- **MSW package**: Use for all external API testing
- **Prefer MSW**: Over Playwright route interception for external APIs
- **Never depend**: On actual external services in tests
