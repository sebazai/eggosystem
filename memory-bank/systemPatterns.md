# System Patterns - Kanaliiga Eggosystem

## Architecture Overview

The Kanaliiga Eggosystem follows a monorepo structure using PNPM workspaces with clear separation between frontend and backend concerns.

## Database Query Patterns

### Critical JOIN Patterns

The most important pattern in the system - PlayerStats relationships:

```sql
-- Correct pattern for PlayerStats
SELECT * FROM PlayerStats ps
INNER JOIN MatchGames mg ON ps.game_id = mg.id
INNER JOIN Matches m ON mg.match_id = m.id

-- Team filtering pattern
const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";
-- Use SeasonTeamPlayers for team relationships

-- League filtering - IMPORTANT
-- Always use l.id instead of m.league_id in WHERE clauses
```

### Dynamic JOIN Strategy

```typescript
// Pattern for conditional JOINs based on filters
const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";
query = query.join(
  "SeasonTeamPlayers as stp",
  teamJoinType,
  "stp.player_id",
  "sp.id"
);

// Prevents data exclusion when filters aren't applied
```

### Query Debugging Pattern

All database queries should include logging for debugging:

```typescript
console.log("Query:", query.toString());
console.log("Parameters:", params);
```

## API Middleware Patterns

### Filter Parameter Processing

Every filtering endpoint MUST use this pattern:

```typescript
// Route definition
router.get("/endpoint", parseQueryFilterParams, controller);

// Controller access
const { season_ids, league_ids, team_ids, stages, map_ids } = req.parsedParams;
```

### Frontend API Proxy Pattern

```typescript
// Frontend API route structure
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = generateFiltersParamQuery(/* filters */);

  const response = await fetch(`${BACKEND_URL}/api${queryString}`);
  return Response.json(await response.json());
}
```

## Frontend Data Patterns

### SWR Data Fetching

```typescript
// Hook pattern
function useData(filters: FilterParams) {
  const { data, error, isLoading } = useSWR(["endpoint", filters], () =>
    nextFetcher("/api/v1/endpoint", filters)
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isValidated: !isLoading && !error
  };
}
```

### Component Filter Integration

```typescript
// Active season default pattern
const effectiveFilters = {
  ...filters,
  seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons
};
```

## UI Component Patterns

### Mobile-First Table Design

```tsx
// Essential columns only on mobile
<th className="px-3 py-2 text-xs">Player</th>
<th className="px-3 py-2 text-xs">K</th>
<th className="px-3 py-2 text-xs">D</th>
<th className="px-3 py-2 text-xs">ADR</th>
<th className="px-3 py-2 text-xs">Rating</th>
// Desktop-only columns
<th className="hidden md:table-cell px-3 py-2 text-xs">Assists</th>
```

### Navigation Pattern

```tsx
// Consistent navigation - NO back buttons
import { AutoBreadcrumbs } from "@/components/layout";

function PageComponent() {
  return (
    <>
      <AutoBreadcrumbs />
      {/* Page content */}
    </>
  );
}
```

### Filtering Component Pattern

```tsx
// Standard filtering integration
import { MultiFilters, useFilters } from "@/components/filters";

function PageWithFilters() {
  const {
    seasons,
    leagues,
    stages,
    teams,
    maps
    // ... other filter state
  } = useFilters();

  return (
    <MultiFilters
      seasons={seasons}
      leagues={leagues}
      // Enable only needed filters, pass null for disabled
      stages={null} // Disabled
      teams={teams}
      maps={maps}
    />
  );
}
```

## Error Handling Patterns

### Hook Return Structure

```typescript
// Consistent hook returns
return {
  data,
  isLoading,
  isError: !!error, // NOT 'error'
  isValidated: !isLoading && !error
};
```

### Frontend Error Detection (Testing)

```typescript
// Test setup for error detection
page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push(`Console error: ${msg.text()}`);
  }
});

page.on("pageerror", (error) => {
  errors.push(`Page error: ${error.message}`);
});

page.on("requestfailed", (request) => {
  errors.push(`Request failed: ${request.url()}`);
});
```

## Link Handling Pattern

### Internal vs External Links

```tsx
// Internal navigation - ALWAYS use Link
import Link from 'next/link';
<Link href="/internal/path">Internal Page</Link>

// External links - use anchor tags
<a
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
</a>
```

## Team Relationship Handling

### Critical Pattern for Team Filtering

```sql
-- CORRECT: Use SeasonTeamPlayers for team relationships
SELECT ps.*, sp.steam_name
FROM PlayerStats ps
INNER JOIN SteamPlayers sp ON ps.player_id = sp.id
INNER JOIN SeasonTeamPlayers stp ON stp.player_id = sp.id
WHERE stp.team_id IN (?)

-- AVOID: Direct team_id matches between MatchTeams and SeasonTeamPlayers
-- This can filter out valid stats due to team changes
```

## Parameter Query Generation

### Filter Parameter Handling

```typescript
// Use utility for consistent parameter building
import { generateFiltersParamQuery } from "@/lib/utils";

const queryString = generateFiltersParamQuery({
  season_ids: seasons,
  league_ids: leagues,
  team_ids: teams,
  stages: stages,
  map_ids: maps
});
```

## Testing Patterns

### Test Structure & Organization

#### File Naming & Location

```typescript
// Test file naming pattern: *.test.ts
// Location: src/__tests__/ directories within respective domains
apps / backend / src / __tests__ / models / player.test.ts;
apps / backend / src / __tests__ / controllers / players.test.ts;
apps / frontend / src / components / __tests__ / player - table.test.tsx;
```

#### Test Organization

```typescript
// Group tests by feature/module with clear describe blocks
describe("Player Statistics", () => {
  describe("when filtering by team", () => {
    test("should return only players from specified teams", () => {
      /* ... */
    });
    test("should handle multiple team filters", () => {
      /* ... */
    });
  });

  describe("when filtering by season", () => {
    test("should apply active season by default", () => {
      /* ... */
    });
    test("should handle empty season arrays", () => {
      /* ... */
    });
  });
});
```

#### Test Database Configuration

```typescript
// Separate test database with proper cleanup
const testConfig = {
  ...baseConfig,
  connection: {
    ...baseConfig.connection,
    database: "kanaliiga_test"
  }
};
```

### Mock Patterns

#### Database Mocking

```typescript
// Mirror actual database structure in mocks
const mockPlayerStats = {
  id: 1,
  player_id: 123,
  game_id: 456,
  kills: 15,
  deaths: 8
  // ... match actual schema
};

// Mock database responses that match real query results
jest.mock("@/lib/database", () => ({
  knex: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis()
    // ... chain all query methods
  })
}));
```

#### Request Mocking

```typescript
// Consistent HTTP request mocking
const mockRequest = {
  parsedParams: {
    season_ids: [1, 2],
    league_ids: [3],
    team_ids: null,
    stages: [],
    map_ids: [5, 6]
  },
  query: {
    /* raw query params */
  }
};

const mockResponse = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis()
};
```

#### Middleware Testing

```typescript
// Test middleware in isolation
describe("parseQueryFilterParams middleware", () => {
  test("should parse season_ids correctly", () => {
    const req = { query: { season_ids: "1,2,3" } };
    const res = {};
    const next = jest.fn();

    parseQueryFilterParams(req, res, next);

    expect(req.parsedParams.season_ids).toEqual([1, 2, 3]);
    expect(next).toHaveBeenCalled();
  });
});
```

### Backend Testing Specifics

#### Model Testing

```typescript
// Test database models with proper setup/teardown
describe("Player Model", () => {
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test("should get player stats with correct JOINs", async () => {
    const stats = await getPlayerStats({ team_ids: [1] });

    expect(stats).toBeDefined();
    // Verify JOIN structure was used correctly
  });
});
```

#### Controller Testing

```typescript
// Test API controllers with mocked dependencies
describe("Players Controller", () => {
  test("should handle player stats request", async () => {
    const mockData = [
      /* test data */
    ];
    jest.spyOn(playerModel, "getPlayerStats").mockResolvedValue(mockData);

    const req = { parsedParams: { season_ids: [1] } };
    const res = { json: jest.fn() };

    await getPlayerStatsController(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockData
    });
  });
});
```

#### Integration Testing

```typescript
// Test complete request flows
describe("Player Stats API Integration", () => {
  test("should return filtered player stats", async () => {
    const response = await request(app)
      .get("/api/players/stats")
      .query({ season_ids: "1,2", team_ids: "3" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});
```

### Query Testing

#### Filter Parameter Testing

```typescript
// Test all filtering scenarios including edge cases
describe("Filter Parameter Testing", () => {
  describe("empty arrays", () => {
    test("should handle empty season_ids", () => {
      const params = { season_ids: [] };
      // Test behavior with empty arrays
    });
  });

  describe("null values", () => {
    test("should handle null team_ids", () => {
      const params = { team_ids: null };
      // Test null handling
    });
  });

  describe("invalid IDs", () => {
    test("should handle non-numeric IDs", () => {
      const params = { season_ids: ["invalid"] };
      // Test validation
    });
  });

  describe("multiple filters combined", () => {
    test("should handle complex filter combinations", () => {
      const params = {
        season_ids: [1, 2],
        league_ids: [3],
        team_ids: [4, 5],
        map_ids: [6]
      };
      // Test complex combinations
    });
  });
});
```

#### JOIN Testing

```typescript
// Verify correct JOIN types and table references
describe("Database JOIN Testing", () => {
  test("should use correct PlayerStats JOIN pattern", () => {
    const query = buildPlayerStatsQuery({ team_ids: [1] });

    expect(query.toString()).toContain(
      "INNER JOIN MatchGames mg ON ps.game_id = mg.id"
    );
    expect(query.toString()).toContain(
      "INNER JOIN Matches m ON mg.match_id = m.id"
    );
  });

  test("should use dynamic JOIN types for team filtering", () => {
    const queryWithTeam = buildPlayerStatsQuery({ team_ids: [1] });
    const queryWithoutTeam = buildPlayerStatsQuery({ team_ids: null });

    expect(queryWithTeam.toString()).toContain("INNER JOIN SeasonTeamPlayers");
    expect(queryWithoutTeam.toString()).toContain(
      "LEFT JOIN SeasonTeamPlayers"
    );
  });
});
```

#### ParsedParams Testing

```typescript
// Ensure middleware correctly parses query parameters
describe("ParsedParams Middleware Testing", () => {
  test("should parse comma-separated IDs", () => {
    const req = { query: { season_ids: "1,2,3" } };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.season_ids).toEqual([1, 2, 3]);
  });

  test("should handle single ID values", () => {
    const req = { query: { league_ids: "5" } };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.league_ids).toEqual([5]);
  });

  test("should set null for missing parameters", () => {
    const req = { query: {} };
    parseQueryFilterParams(req, {}, () => {});

    expect(req.parsedParams.team_ids).toBeNull();
  });
});
```

### Test Data Management

#### Seed Data

```typescript
// Use consistent test data representing realistic scenarios
const testSeedData = {
  seasons: [
    { id: 1, name: "Season 1", is_active: true },
    { id: 2, name: "Season 2", is_active: false }
  ],
  players: [
    { id: 1, steam_name: "TestPlayer1", steam_id: "12345" },
    { id: 2, steam_name: "TestPlayer2", steam_id: "67890" }
  ]
  // ... realistic test data
};
```

#### Data Cleanup

```typescript
// Ensure proper cleanup between test runs
beforeEach(async () => {
  await knex("PlayerStats").del();
  await knex("MatchGames").del();
  await knex("Matches").del();
  // Clean in reverse dependency order
});

afterEach(async () => {
  // Additional cleanup if needed
  await knex.raw("TRUNCATE TABLE player_stats RESTART IDENTITY CASCADE");
});
```

#### Database State Testing

```typescript
// Test both empty and populated database scenarios
describe("Database State Scenarios", () => {
  test("should handle empty database", async () => {
    // Test with no data
    const result = await getPlayerStats({});
    expect(result).toEqual([]);
  });

  test("should handle populated database", async () => {
    // Test with seeded data
    await seedTestData();
    const result = await getPlayerStats({});
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Error Handling Testing

#### Validation Testing

```typescript
// Test input validation with valid and invalid data
describe("Input Validation", () => {
  test("should accept valid filter parameters", () => {
    const validParams = { season_ids: [1, 2], team_ids: [3] };
    expect(() => validateFilterParams(validParams)).not.toThrow();
  });

  test("should reject invalid filter parameters", () => {
    const invalidParams = { season_ids: ["invalid"] };
    expect(() => validateFilterParams(invalidParams)).toThrow();
  });
});
```

#### Error Response Testing

```typescript
// Verify proper error responses and status codes
describe("Error Response Testing", () => {
  test("should return 400 for invalid parameters", async () => {
    const response = await request(app)
      .get("/api/players/stats")
      .query({ season_ids: "invalid" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test("should return 500 for database errors", async () => {
    jest.spyOn(knex, "select").mockRejectedValue(new Error("DB Error"));

    const response = await request(app).get("/api/players/stats").expect(500);

    expect(response.body.success).toBe(false);
  });
});
```

#### Edge Case Testing

```typescript
// Test boundary conditions and unexpected input
describe("Edge Cases", () => {
  test("should handle extremely large arrays", () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const params = { season_ids: largeArray };
    // Test performance and limits
  });

  test("should handle special characters in input", () => {
    const params = { season_ids: ["1; DROP TABLE seasons;"] };
    // Test SQL injection prevention
  });
});
```

### Frontend Error Detection Setup

#### Comprehensive Error Monitoring

```typescript
// Complete error detection setup for frontend tests
let errors: string[] = [];

beforeEach(() => {
  errors = [];

  // Console error monitoring
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`Console error: ${msg.text()}`);
    }
  });

  // Uncaught exception handling
  page.on("pageerror", (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  // Network failure detection
  page.on("requestfailed", (request) => {
    errors.push(`Request failed: ${request.url()}`);
  });
});

// Error collection and cleanup
afterEach(() => {
  if (errors.length > 0) {
    throw new Error(`Frontend errors detected:\n${errors.join("\n")}`);
  }
});
```

### Performance Testing

#### Query Performance

```typescript
// Test database queries perform efficiently with larger datasets
describe("Query Performance", () => {
  test("should execute player stats query within time limit", async () => {
    const startTime = Date.now();
    await getPlayerStats({ season_ids: [1, 2] });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // < 1 second
  });

  test("should handle large result sets efficiently", async () => {
    // Insert large dataset
    await insertLargeTestDataset();

    const startTime = Date.now();
    const results = await getPlayerStats({});
    const endTime = Date.now();

    expect(results.length).toBeGreaterThan(1000);
    expect(endTime - startTime).toBeLessThan(2000); // < 2 seconds
  });
});
```

#### Memory Usage Monitoring

```typescript
// Monitor memory usage in tests, especially for data-heavy operations
describe("Memory Usage", () => {
  test("should not leak memory during large operations", () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform memory-intensive operation
    for (let i = 0; i < 1000; i++) {
      // Process large datasets
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB increase
  });
});
```

## Performance Optimization Patterns

### Query Performance

- Use INNER JOINs for active filters (reduces result set)
- Use LEFT JOINs for optional data (preserves all results)
- Always include proper indexes on foreign keys
- Log query execution times in development

### Frontend Performance

- SWR caching prevents redundant requests
- Mobile-first design reduces initial payload
- Essential data only on small screens
- Progressive enhancement for larger screens

## Testing Architecture

### Test Categories and Structure

**Backend Tests** (`apps/backend/src/__tests__/`)

- **Unit Tests**: Service functions, models, utilities
- **Controller Tests**: API endpoint behavior with mocked dependencies
- **Pattern**: Use Jest with `supertest` for HTTP testing
- **Mocking**: Mock Redis, database, external APIs appropriately

**Frontend Tests** (`apps/frontend/src/__tests__/`)

```
__tests__/
├── unit/          # Component unit tests (isolated)
├── integration/   # Component integration (mocked APIs)
└── e2e/           # End-to-end flows (real backend)
```

**Integration vs E2E Decision Matrix**

- **Integration**: Component interactions, form behavior, UI state changes (mock APIs)
- **E2E**: Full user journeys, navigation flows, real data persistence (real backend)
- **Error Signal**: `ECONNREFUSED` errors indicate test is in wrong category

### Error Handling Patterns

**When to Use try/catch**

- ✅ JSON.parse() operations (can throw on malformed data)
- ✅ Data validation and transformation
- ✅ Database operations (actual integration boundary)
- ✅ External API calls (third-party services)
- ✅ Resource cleanup (files, connections)

**When NOT to Use try/catch**

- ❌ Redis operations (`redisClient.get()` returns null on errors)
- ❌ Simple validation (use validation libraries)
- ❌ Playwright navigation (has built-in retry mechanisms)
- ❌ Generic error swallowing

**Pattern**: Follow existing codebase patterns rather than adding defensive try/catch blocks

### Playwright Testing Patterns

**Navigation Helpers**

```typescript
// ✅ Simple and reliable
async function navigateToPage(page: Page, url: string) {
  await page.goto(url, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
}

// ❌ Unnecessary complexity
async function navigateWithRetry(page: Page, url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      /* ... */
    } catch {
      /* ... */
    }
  }
}
```

**Test Reliability**

- Use Playwright's built-in retry and timeout mechanisms
- Mock external dependencies consistently
- Separate concerns: integration tests mock APIs, E2E tests use real backend

### E2E Testing Database Management

**Critical Database Reset Pattern**

```bash
# ALWAYS run this sequence before/after E2E tests
cd apps/backend && pnpm run reseed && pnpm run seed && pnpm run seed:e2e
```

**Why Database Reset is Critical**

- E2E tests modify real database state
- Email verification consumes tokens (sets to NULL, deletes from Redis)
- User registrations create permanent records
- Parallel test execution can conflict over shared resources
- Tests may fail due to "consumed" data from previous runs

**Test Isolation Strategies**

```typescript
// ✅ Create multiple test tokens in seed to prevent conflicts
const validTokenAccounts = [
  { id: 100, token: "valid-token-123", email: "test1@kanaliiga.fi" },
  { id: 102, token: "valid-token-456", email: "test2@kanaliiga.fi" },
  { id: 103, token: "valid-token-789", email: "test3@kanaliiga.fi" }
  // ... more tokens for parallel test execution
];

// ✅ Use different tokens for different tests
test("success case 1", () => {
  await navigateToPage(page, "/verify-email?token=valid-token-123");
});

test("success case 2", () => {
  await navigateToPage(page, "/verify-email?token=valid-token-456");
});

// ❌ Reusing tokens causes test isolation failures
test("success case 1", () => {
  await navigateToPage(page, "/verify-email?token=shared-token");
});
test("success case 2", () => {
  await navigateToPage(page, "/verify-email?token=shared-token"); // FAILS if first test consumed it
});
```

**Debugging DOM Element Issues**

```typescript
// ✅ Comprehensive DOM inspection for failing selectors
async function debugPageElements(page: Page, state: string) {
  // Find all SVG elements and their actual classes
  const svgElements = await page.$$eval("svg", (elements) =>
    elements.map((el) => ({
      className: el.className.baseVal || el.className,
      classList: Array.from(el.classList || []),
      attributes: Array.from(el.attributes).map(
        (attr) => `${attr.name}="${attr.value}"`
      ),
      outerHTML: el.outerHTML.substring(0, 200) + "..."
    }))
  );

  // Test different selector strategies
  const strategies = [
    "svg.lucide-circle-check-big", // Actual Lucide class
    "svg.lucide-circle-x", // Actual Lucide class
    '[data-testid="check-circle-icon"]' // May not work with Lucide
  ];

  for (const strategy of strategies) {
    const count = await page.locator(strategy).count();
    console.log(`Strategy "${strategy}": ${count} found`);
  }
}
```

**Test Reliability**

- Use Playwright's built-in retry and timeout mechanisms
- Mock external dependencies consistently
- Separate concerns: integration tests mock APIs, E2E tests use real backend

## Email Template Patterns

### HTML Email Best Practices

**Button Centering**

```html
<!-- ✅ Reliable across all email clients -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
  <tr>
    <td style="text-align: center;">
      <a
        href="..."
        style="background-color: hsl(35, 93%, 49%); color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; text-align: center;"
      >
        Button Text
      </a>
    </td>
  </tr>
</table>

<!-- ❌ Unreliable in Outlook and other clients -->
<div style="text-align: center;">
  <a href="..." style="...">Button Text</a>
</div>
```

**Email Client Compatibility**

- Use table-based layouts for critical structural elements
- Avoid flexbox, grid, and modern CSS for layout
- Test in Outlook (worst CSS support) and Gmail (good reference)
- Inline styles only - external stylesheets are stripped
- Use `cellpadding="0" cellspacing="0"` on all tables

**Kanaliiga Brand Colors**

- Primary orange: `hsl(35, 93%, 49%)`
- Secondary link color: `hsl(29, 56%, 58%)`
- Text color: `#333`
- Muted text: `#777`

## Backend Testing Patterns

### Test Organization Structure

```
apps/backend/
├── src/
│   ├── controllers/
│   │   ├── playerController.ts
│   │   └── __tests__/
│   │       └── playerController.test.ts
│   ├── services/
│   │   ├── playerService.ts
│   │   └── __tests__/
│   │       └── playerService.test.ts
│   └── models/
│       ├── playerModel.ts
│       └── __tests__/
│           └── playerModel.test.ts
```

### Jest Configuration Patterns

```javascript
// jest.config.js - Backend
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/__tests__/**/*"
  ]
};
```

### Mocking Strategy Patterns

#### Database Mocking (Unit Tests)

```typescript
// Unit tests - Mock database layer
import * as db from "../database";

jest.mock("../database", () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("PlayerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get player stats", async () => {
    mockDb.query.mockResolvedValue([{ id: 1, name: "Player1" }]);

    const result = await playerService.getStats(1);

    expect(result).toEqual([{ id: 1, name: "Player1" }]);
    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT"),
      [1]
    );
  });
});
```

#### Redis Mocking

```typescript
// Redis mocking pattern
import { createClient } from "redis";

jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }))
}));

const mockRedis = createClient() as jest.Mocked<
  ReturnType<typeof createClient>
>;
```

#### External Service Mocking

```typescript
// Mock external APIs completely
jest.mock("../services/steamApi", () => ({
  fetchPlayerData: jest.fn(),
  fetchMatchData: jest.fn()
}));

// Define specific responses for each test
mockSteamApi.fetchPlayerData.mockResolvedValue({
  steamId: "123",
  name: "TestPlayer"
});
```

### Controller Testing Patterns

```typescript
// Integration testing for controllers
import request from "supertest";
import { app } from "../app";

describe("Player Controller", () => {
  beforeEach(async () => {
    // Reset database to known state
    await resetTestDatabase();
  });

  it("should return player stats", async () => {
    const response = await request(app)
      .get("/api/v1/players/1/stats")
      .query({
        season_ids: "1,2",
        league_ids: "1"
      })
      .expect(200);

    expect(response.body).toMatchSchema({
      type: "object",
      properties: {
        data: { type: "array" },
        total: { type: "number" }
      }
    });
  });
});
```

### Test Data Management

```typescript
// Test data factory pattern
export const createTestPlayer = (overrides = {}) => ({
  id: 1,
  steam_id: "76561198000000000",
  steam_name: "TestPlayer",
  ...overrides
});

export const createTestMatch = (overrides = {}) => ({
  id: 1,
  league_id: 1,
  season_id: 1,
  date: new Date("2025-01-01"),
  ...overrides
});

// Usage in tests
const testPlayer = createTestPlayer({ steam_name: "CustomName" });
```

### Error Testing Patterns

```typescript
// Testing error scenarios
describe("Error Handling", () => {
  it("should handle database connection errors", async () => {
    mockDb.query.mockRejectedValue(new Error("Connection failed"));

    await expect(playerService.getStats(1)).rejects.toThrow(
      "Database connection error"
    );
  });

  it("should handle validation errors", async () => {
    await expect(playerService.getStats(-1)).rejects.toThrow(ValidationError);
  });
});
```

### Performance Testing

```typescript
// Performance boundaries testing
describe("Performance", () => {
  it("should return player stats within 500ms", async () => {
    const start = Date.now();

    await playerService.getStats(1);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

### Test Environment Setup

```typescript
// src/__tests__/setup.ts
import { setupTestDatabase, teardownTestDatabase } from "./helpers/database";

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Global test timeout
jest.setTimeout(10000);
```

### Snapshot Testing for API Responses

```typescript
// API response structure testing
it("should maintain consistent response structure", async () => {
  const response = await request(app)
    .get("/api/v1/players/1/stats")
    .expect(200);

  // Remove dynamic fields for snapshot
  const sanitized = {
    ...response.body,
    data: response.body.data.map((item) => ({
      ...item,
      id: "[DYNAMIC]",
      date: "[DYNAMIC]"
    }))
  };

  expect(sanitized).toMatchSnapshot();
});
```
