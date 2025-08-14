# Testing Patterns

## Testing Architecture

### Test Strategy Hierarchy

**Unit Tests (Jest + React Testing Library)**

- **Purpose**: Test individual components and functions in isolation
- **Speed**: Very fast (< 5 seconds)
- **Scope**: Single component or utility function
- **Command**: `pnpm test` (fast feedback during development)
- **Watch Mode**: `pnpm test:watch` (TDD workflow)

**E2E Tests (Playwright)**

- **Purpose**: Test complete user workflows with real backend
- **Speed**: Slower (requires database setup)
- **Scope**: Multi-component interactions, full user journeys
- **Command**: `cd $(git rev-parse --show-toplevel) && pnpm test:e2e` (**ALWAYS from root**)
- **Database**: Full reseed, seed, seed:e2e setup

**Testing Strategy Rules:**

1. **E2E Command Requirements**:
   - **MUST run from monorepo root**: Ensures proper database seeding and builds
   - **Does NOT start dev:e2e backend**: That's handled separately
   - **Includes build step**: Ensures latest code is tested

2. **Boundary Value Testing Strategy**:
   - **Minimum Valid Values**: Test smallest acceptable inputs (e.g., 2-char names)
   - **Maximum Valid Values**: Test largest acceptable inputs (e.g., max length strings)
   - **Below Minimum**: Test values just under the limit (should fail validation)
   - **Above Maximum**: Test values just over the limit (should fail validation)
   - **Edge Cases**: Empty strings, null values, special characters
   - **Boundary Transitions**: Test exactly at the limits

3. **Package/Types Build Requirement**:
   - **After any changes in packages/types**: `cd $(git rev-parse --show-toplevel) && pnpm --filter=@eggosystem/types build`
   - **Why**: Changes don't auto-propagate to backend/frontend
   - **When**: Before running tests or starting dev servers after type changes

## TDD Workflow Patterns

**Red-Green-Refactor Cycle:**

1. **Red**: Write failing test first
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while keeping tests green

**Command Preferences:**

- **Development**: `pnpm test:watch` for continuous feedback
- **Specific Files**: `pnpm test path/to/specific.test.ts` for targeted testing
- **Full Suite**: `pnpm test:all` for comprehensive validation

## Error Testing Patterns

**Use `await expect().rejects.toThrow()` for testing expected failures:**

```typescript
// ✅ Good - Jest async error testing
it("should fail with invalid data", async () => {
  await expect(serviceFunction(invalidData)).rejects.toThrow(
    /validation error/i
  );
});

// ❌ Bad - manual try/catch in tests
it("should fail with invalid data", async () => {
  try {
    await serviceFunction(invalidData);
    throw new Error("Should have failed");
  } catch (error) {
    expect(error.message).toContain("validation");
  }
});
```

**Boundary Value Test Examples:**

```typescript
// Test minimum valid value
it("should accept minimum valid organization name", async () => {
  await expect(validateOrgName("AB")).resolves.toBe(true);
});

// Test below minimum (should fail)
it("should reject organization name below minimum", async () => {
  await expect(validateOrgName("A")).rejects.toThrow(/at least 2 characters/i);
});

// Test maximum valid value
it("should accept maximum valid organization name", async () => {
  const maxName = "A".repeat(100); // assuming 100 is max
  await expect(validateOrgName(maxName)).resolves.toBe(true);
});

// Test above maximum (should fail)
it("should reject organization name above maximum", async () => {
  const tooLongName = "A".repeat(101);
  await expect(validateOrgName(tooLongName)).rejects.toThrow(/too long/i);
});
```

## Test Structure & Organization

### File Naming & Location

```typescript
// Test file naming pattern: *.test.ts
// Location: src/__tests__/ directories within respective domains
apps / backend / src / __tests__ / models / player.test.ts;
apps / backend / src / __tests__ / controllers / players.test.ts;
apps / frontend / src / components / __tests__ / player - table.test.tsx;
```

### Test Organization

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

### Test Database Configuration

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

## Mock Patterns

### Database Mocking

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

### Request Mocking

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

### Middleware Testing

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

## Backend Testing Specifics

### Model Testing

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

### Controller Testing

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

### Integration Testing

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

## Frontend Testing Specifics

### Component Testing

```typescript
// Test React components with React Testing Library
describe("PlayerTable", () => {
  test("should render player data correctly", () => {
    const mockData = [
      { id: 1, name: "Player 1", kills: 10, deaths: 5 },
      { id: 2, name: "Player 2", kills: 15, deaths: 8 }
    ];

    render(<PlayerTable data={mockData} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  test("should show loading state", () => {
    render(<PlayerTable isLoading={true} />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  test("should show error state", () => {
    render(<PlayerTable isError={true} />);

    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
  });
});
```

### Hook Testing

```typescript
// Test custom hooks with renderHook
describe("usePlayerStats", () => {
  test("should fetch player stats", async () => {
    // Mock SWR response
    (useSWR as jest.Mock).mockImplementation(() => ({
      data: mockPlayerStats,
      error: undefined,
      isLoading: false
    }));

    const { result } = renderHook(() => usePlayerStats({ season_ids: [1] }));

    expect(result.current.data).toEqual(mockPlayerStats);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
```

### E2E Testing

```typescript
// Test complete user workflows with Playwright
test("user can filter player statistics", async ({ page }) => {
  await page.goto("/players");

  // Select filter options
  await page.selectOption("[data-testid=season-filter]", "1");
  await page.click("[data-testid=apply-filters]");

  // Verify filtered results
  await expect(page.locator("table")).toContainText("Player 1");
  await expect(page.locator("[data-testid=filter-badge]")).toContainText(
    "Season 1"
  );
});
```

## Frontend Error Detection Setup

### Comprehensive Error Monitoring

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

## Testing Best Practices

### General Principles

- **Test Behavior**: Focus on what the code does, not how it does it
- **Mock Strategy**: Mock external dependencies in unit tests, use real backend in e2e tests
- **User Perspective**: Test from the user's point of view
- **Error Handling**: Test error states and edge cases
- **Backend Integration**: E2E tests require backend running with external API stubbing

### Test Quality

- **Reliability**: Tests should pass consistently without flakiness
- **Maintainability**: Tests should be easy to understand and modify
- **Performance**: Tests should run quickly and efficiently
- **Documentation**: Tests should serve as living documentation

### React 19 + Radix UI Testing Pattern

```typescript
// Add this at the top of test files using Radix UI components
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});
```

## CI/CD Integration

### GitLab CI Testing

- **Unit Tests**: Automated Jest testing for both frontend and backend
- **E2E Tests**: Automated Playwright testing for frontend workflows
- **Coverage Reporting**: Test coverage metrics and reporting
- **Quality Gates**: Tests must pass before deployment

### Test Commands

```bash
# Frontend unit tests
cd apps/frontend && pnpm test

# Frontend e2e tests (all e2e tests) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e

# Frontend e2e tests (specific file) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e kanahautomo.test.ts

# Frontend e2e tests (specific test by title) - FOR DEBUGGING ONLY
cd apps/frontend && pnpm test:e2e -g "happy path: authenticated user can register for Kanahautomo"

# Frontend e2e tests (UI mode for debugging)
cd apps/frontend && pnpm test:e2e:ui kanahautomo.test.ts

# Frontend e2e tests (headed mode to see browser)
cd apps/frontend && pnpm test:e2e:headed kanahautomo.test.ts

# Backend unit tests
cd apps/backend && pnpm test

# All unit tests from monorepo root (fast feedback)
pnpm test

# All tests from monorepo root (comprehensive testing)
pnpm test:all

# E2E tests from monorepo root (RECOMMENDED - handles all setup automatically)
pnpm test:e2e

# E2E tests from monorepo root (specific file - RECOMMENDED)
pnpm test:e2e kanahautomo.test.ts

# TDD - Watch mode for unit tests (automatically runs on file changes)
pnpm test:watch
```

**What `pnpm test:e2e` from root does automatically:**

1. **Database Setup**: Runs `pnpm --filter=backend reseed:e2e` (resets and seeds database)
2. **Build**: Runs `pnpm build` (builds the entire project)
3. **E2E Tests**: Runs `pnpm --filter=frontend test:e2e` (executes Playwright tests)

**IMPORTANT**: Always run e2e tests from the monorepo root using `pnpm test:e2e`. This ensures:

- ✅ Database is properly set up with e2e test data
- ✅ Project is built with latest changes
- ✅ Backend is ready for e2e testing
- ✅ No manual backend setup required

## Debugging Pattern: Start Simple, Grow from There

### The Ladder of Complexity Rule

Always start at the bottom rung and work your way up:

1. **Rung 1: Obvious Changes** - What just changed? (file moves, renames, etc.)
2. **Rung 2: Import/Path Issues** - Are references still valid?
3. **Rung 3: Configuration Issues** - Are settings/configs correct?
4. **Rung 4: Logic Issues** - Is the actual code logic wrong?
5. **Rung 5: Architecture Issues** - Are there deeper structural problems?

**Rule**: Don't jump to Rung 4 or 5 until you've eliminated 1-3.

### The "Occam's Razor" Approach

When debugging, ask: "What's the simplest explanation for this error?"

- File moved → paths broken → fix paths
- Not: File moved → complex React architecture issues → rewrite entire test strategy

### The "Change Correlation" Principle

If something breaks immediately after a change, the cause is likely **directly related** to that change, not some pre-existing complex issue.

### Ask the User for Context

Before jumping into complex debugging scenarios, ask the user:

1. **"Did this work before?"** - If yes, focus on what changed
2. **"What did you do before it stopped working?"** - The cause is likely in the recent changes
3. **"What was the last thing that worked?"** - This gives you a baseline to compare against
