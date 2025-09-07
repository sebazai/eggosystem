# Test Utilities

This directory contains reusable utilities for backend tests, particularly for handling environment variables and Express app setup.

## ⚠️ Important: Do Not Import Full App

**NEVER** import the full app in tests:

```typescript
// ❌ BAD: Don't do this
import { app } from "../app";
```

**Why not?**

- Creates unnecessary dependencies on the entire application
- Makes tests slower and more complex
- Can cause environment variable timing issues
- Makes tests harder to isolate and debug

**Instead, use the test utilities below to create focused test apps.**

## 🔧 Environment Variable Timing

**CRITICAL**: Environment variables must be set **before** importing modules that depend on them:

```typescript
// ✅ GOOD: Set environment variables first
process.env.FRONTEND_URL = "http://localhost:3000";

// Then import modules that depend on them
import playerRouter from "./player.routes";
import { expressErrorHandler } from "../../middlewares/express-error-handler";

// ❌ BAD: Setting environment variables after imports
import playerRouter from "./player.routes"; // This will fail if FRONTEND_URL is not set
process.env.FRONTEND_URL = "http://localhost:3000"; // Too late!
```

## 🎯 Import Only What You Test

**Always import the specific router you're testing, not parent routers:**

```typescript
// ✅ GOOD: Import the specific router using project root paths
import { createExpressTestApp } from "../test-utils";

const { app, cleanup } = createExpressTestApp(
  "src/routes/v1/dashboard/sortter.routes", // Specific router from project root
  "/api/v1/dashboard/sortter" // Exact mount path
);

// ❌ BAD: Importing parent router
const { app, cleanup } = createExpressTestApp(
  "src/routes/v1/dashboard/index", // Parent router
  "/api/v1/dashboard" // Broader mount path
);
```

**Why?**

- Tests only load the code they actually test
- Faster test execution
- Clearer test dependencies
- Easier to debug when tests fail

**Exception**: When testing multiple related routes in the same router file, it's acceptable to import the broader router:

```typescript
// ✅ ACCEPTABLE: Testing multiple routes from same router
const { app, cleanup } = createExpressTestApp(
  "src/routes/v1/filter.routes", // Contains both skill-diagram and retake-stats
  "/api/v1/filters"
);
```

## Environment Setup

### Problem

Many tests need to set `FRONTEND_URL` environment variable, but setting it after imports doesn't work because the CORS middleware reads it at module load time.

### Solution

Use the environment setup utilities that handle proper timing and cleanup.

## Available Utilities

### `createExpressTestApp(routerPath, mountPath?)`

Creates a complete Express test app with proper environment setup for specific routes.

```typescript
import { createExpressTestApp } from "../test-utils";

describe("My Route Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      "../routes/v1/my.routes",
      "/my-route" // optional, defaults to "/"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  // Your tests here...
});
```

### `setupFrontendUrl(testUrl?)`

Sets up `FRONTEND_URL` and returns a cleanup function.

```typescript
import { setupFrontendUrl } from "../test-utils";

describe("My Tests", () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupFrontendUrl("https://custom-test-url.com");
  });

  afterEach(() => {
    cleanup();
  });
});
```

### `setupEnvironment(variables)`

Sets up multiple environment variables at once.

```typescript
import { setupEnvironment } from "../test-utils";

describe("My Tests", () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000",
      BACKEND_SERVICE_API_KEY: "test-key",
      NODE_ENV: "test"
    });
  });

  afterEach(() => {
    cleanup();
  });
});
```

## Migration Guide

### Before (Problematic Pattern)

```typescript
// ❌ BAD: Setting env vars after imports
import express from "express";
import myRouter from "./my.routes";

process.env.FRONTEND_URL = "http://localhost:3000"; // Too late!

const app = express();
app.use("/my", myRouter);
```

### After (Correct Pattern)

```typescript
// ✅ GOOD: Using test utilities
import { createExpressTestApp } from "../test-utils";

describe("My Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      "./my.routes",
      "/my"
    );
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });
});
```

## When to Use Which Utility

### `createExpressTestApp()` - For Route-Specific Tests

- **Use when**: Testing a specific router in isolation
- **Examples**: Testing `/players/*` routes only
- **Benefits**: Faster setup, focused testing

### `setupFrontendUrl()` - For Custom Setup

- **Use when**: You need custom environment setup
- **Examples**: Setting up specific test configurations
- **Benefits**: Maximum flexibility

## Benefits

1. **Proper Timing**: Environment variables are set before router imports
2. **Automatic Cleanup**: No need to manually restore environment variables
3. **Consistency**: All tests use the same pattern
4. **Reusability**: Easy to use across multiple test files
5. **Type Safety**: Full TypeScript support

## Examples

See `src/integration/player-latest-season-stats.test.ts` for a complete example of using these utilities.
