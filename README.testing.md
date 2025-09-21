# Testing Strategy

This document outlines the testing approach, patterns, and best practices for the Kanaliiga Eggosystem.

## Testing Philosophy

### Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle:

1. **Red**: Write failing tests first
2. **Green**: Write minimal code to make tests pass
3. **Refactor**: Improve code while keeping tests green

### Testing Pyramid

- **Unit Tests**: Fast, isolated tests for business logic
- **Integration Tests**: Test component interactions
- **E2E Tests**: Full user workflow testing

## Test Commands

### Primary Commands

```bash
# Fast unit tests (development feedback)
pnpm test

# E2E tests (complete workflows)
pnpm test:e2e

# Comprehensive testing (all tests)
pnpm test:all

# Watch mode for TDD
pnpm test:watch
```

### Command Hierarchy

- **`pnpm test`**: Fast Jest-based unit tests only
- **`pnpm test:e2e`**: E2E tests with database setup
- **`pnpm test:all`**: Both unit and E2E tests
- **`pnpm test:watch`**: TDD watch mode

## Backend Testing

### Unit Testing (Jest)

**Location**: `apps/backend/src/**/*.test.ts`

**Patterns**:

```typescript
// Controller tests
describe("UserController", () => {
  const mockNext = jest.fn();

  it("should return user data", async () => {
    const req = { params: { id: "123" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUserController(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ id: "123" })
    );
  });

  it("should handle errors", async () => {
    const req = { params: { id: "invalid" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await getUserController(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found", status: 404 })
    );
  });
});
```

### Route Testing (Supertest)

**Location**: `apps/backend/src/routes/**/*.test.ts`

**Setup Pattern**:

```typescript
// Set environment variables before imports
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import { createExpressTestApp } from "../../test-utils";
import router from "./router.routes";

describe("API Routes", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      router,
      "/api/v1/path"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  it("should return data", async () => {
    const response = await request(app).get("/api/v1/path").expect(200);

    expect(response.body).toHaveProperty("success", true);
  });
});
```

### Service Testing

**Patterns**:

```typescript
// Service tests with mocked dependencies
describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create user", async () => {
    const userData = { name: "Test User", email: "test@example.com" };

    const result = await createUser(userData);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Test User");
  });

  it("should throw error for invalid data", async () => {
    const invalidData = { name: "" };

    await expect(createUser(invalidData)).rejects.toThrow("Name is required");
  });
});
```

## Frontend Testing

### Unit Testing (Jest + React Testing Library)

**Location**: `apps/frontend/src/**/*.test.tsx`

**Patterns**:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  it("should display user information", () => {
    const user = { id: 1, name: "John Doe", email: "john@example.com" };

    render(<UserProfile user={user} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should handle user interactions", () => {
    const mockOnEdit = jest.fn();
    const user = { id: 1, name: "John Doe" };

    render(<UserProfile user={user} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByText("Edit"));
    expect(mockOnEdit).toHaveBeenCalledWith(user);
  });
});
```

### Integration Testing

**Location**: `apps/frontend/src/__tests__/integration/`

**Patterns**:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { UserList } from "../UserList";

describe("UserList Integration", () => {
  it("should load and display users", async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

**Location**: `apps/frontend/src/__tests__/e2e/`

**Setup**:

```bash
# Install Playwright
pnpm exec playwright install
pnpm exec playwright install-deps

# Start E2E backend
pnpm --filter=backend dev:e2e

# Run E2E tests
pnpm test:e2e
```

**Patterns**:

```typescript
import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  test("should create new user", async ({ page }) => {
    await page.goto("/users");

    await page.click("text=Add User");
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "john@example.com");
    await page.click("text=Save");

    await expect(page.locator("text=John Doe")).toBeVisible();
  });
});
```

## Test Utilities

### Backend Test Utilities

**`createExpressTestApp`**:

```typescript
import { createExpressTestApp } from "../../test-utils";

const { app, cleanup } = createExpressTestApp(router, "/api/v1/path");
```

**Features**:

- Automatic environment setup
- Express app configuration
- Error handling middleware
- Cleanup management

### Frontend Test Utilities

**Custom Render**:

```typescript
import { render } from "../test-utils/custom-render";

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <Router>{component}</Router>
    </Provider>
  );
};
```

## Mocking Strategies

### Backend Mocking

```typescript
// Mock external services
jest.mock("../services/externalApi", () => ({
  fetchUserData: jest.fn().mockResolvedValue({ id: 1, name: "Test" })
}));

// Mock database
jest.mock("../db/connection", () => ({
  query: jest.fn().mockResolvedValue([{ id: 1, name: "Test" }])
}));
```

### Frontend Mocking

```typescript
// Mock API calls
jest.mock("../api/users", () => ({
  fetchUsers: jest.fn().mockResolvedValue([{ id: 1, name: "Test" }])
}));

// Mock React Router
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn()
}));
```

## Database Testing

### Test Database Setup

```typescript
// Use test database for integration tests
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});

beforeEach(async () => {
  await seedTestData();
});
```

### Migration Testing

```typescript
describe("Database Migrations", () => {
  it("should run migrations successfully", async () => {
    await expect(runMigrations()).resolves.not.toThrow();
  });

  it("should rollback migrations", async () => {
    await runMigrations();
    await expect(rollbackMigrations()).resolves.not.toThrow();
  });
});
```

## Error Testing

### Backend Error Testing

```typescript
// Test error responses
it("should return 404 for non-existent user", async () => {
  const response = await request(app).get("/api/v1/users/999").expect(404);

  expect(response.body).toMatchObject({
    type: "about:blank",
    title: "Not Found",
    status: 404,
    detail: "User not found"
  });
});
```

### Frontend Error Testing

```typescript
// Test error states
it("should display error message", async () => {
  jest.spyOn(api, "fetchUsers").mockRejectedValue(new Error("Network error"));

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText("Failed to load users")).toBeInTheDocument();
  });
});
```

## Performance Testing

### Backend Performance

```typescript
// Test response times
it("should respond within acceptable time", async () => {
  const start = Date.now();

  await request(app).get("/api/v1/users");

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000); // 1 second
});
```

### Frontend Performance

```typescript
// Test component rendering performance
it("should render large lists efficiently", () => {
  const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`
  }));

  const start = performance.now();
  render(<UserList users={largeUserList} />);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100); // 100ms
});
```

## Best Practices

### Test Organization

1. **Group related tests**: Use `describe` blocks for logical grouping
2. **Clear test names**: Describe what the test is doing
3. **Arrange-Act-Assert**: Structure tests clearly
4. **One assertion per test**: Focus on single behavior

### Test Data

1. **Use factories**: Create test data with factory functions
2. **Minimal data**: Only include necessary data for tests
3. **Realistic data**: Use data that reflects real usage
4. **Cleanup**: Always clean up test data

### Mocking Guidelines

1. **Mock external dependencies**: Don't test third-party code
2. **Mock at boundaries**: Mock at service boundaries
3. **Verify interactions**: Check that mocks are called correctly
4. **Reset mocks**: Clear mocks between tests

### Coverage Goals

- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: Cover critical user flows
- **E2E Tests**: Cover main user journeys
- **Error Cases**: Test error handling paths

## Continuous Integration

### Test Pipeline

1. **Lint and Format**: Code quality checks
2. **Type Check**: TypeScript validation
3. **Unit Tests**: Fast feedback loop
4. **Integration Tests**: Component interaction testing
5. **E2E Tests**: Full workflow validation

### Test Reports

- **Coverage Reports**: HTML coverage reports
- **Test Results**: JUnit XML for CI integration
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Failed test analysis
