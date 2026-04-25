# Playwright Testing and Trace Viewing

This guide covers how to run Playwright tests, view traces, and debug failed E2E tests in the DevContainer environment.

**Rule:** Always run E2E (Playwright) tests from the **workspace root** with `rtk pnpm test:e2e`. Do not run from `apps/frontend` as the primary way to validate E2E; that skips reseed and build.

## Table of Contents

- [Running Tests](#running-tests)
- [Viewing Traces Locally](#viewing-traces-locally)
- [Viewing CI Artifacts](#viewing-ci-artifacts)
- [Trace Configuration](#trace-configuration)
- [Troubleshooting](#troubleshooting)

## Running Tests

### Prerequisites

Before running E2E tests, ensure the backend E2E server is running:

```bash
rtk pnpm --filter=backend dev:e2e
```

This starts the backend in E2E mode with:

- E2E database configuration
- Test-specific environment variables
- Isolated data for testing

**Note**: Keep this terminal running while you execute E2E tests.

### Run All E2E Tests

**Always run from workspace root:**

```bash
cd $(git rev-parse --show-toplevel) && rtk pnpm test:e2e
```

This command will:

1. Build the frontend and backend (so `@eggosystem/types` and other deps exist for seeds)
2. Reseed the E2E database
3. Run all Playwright tests

**If Playwright never starts**: `test:e2e` can fail during reseed (e.g. DB privilege errors). Start the backend, then from workspace root:

```bash
# Terminal 1: start backend E2E server
cd $(git rev-parse --show-toplevel)/apps/backend && rtk pnpm dev:e2e

# Terminal 2: from workspace root, ensure build exists, then run Playwright only (skips reseed)
cd $(git rev-parse --show-toplevel) && rtk pnpm build && rtk pnpm test:e2e:run
```

**Clear caches and retry**: from workspace root, use `pnpm test:e2e:clean` to clear turbo, `.next`, and Playwright artifacts, then run `pnpm test:e2e`.

**Developing tests**: When iterating on a single spec, keep `dev:e2e` running and use `pnpm test:e2e:run` from workspace root (or `pnpm test:e2e:ui`) so Playwright runs without waiting on reseed/build. For validation and CI, always use `pnpm test:e2e` from workspace root.

### Run Tests in UI Mode

For interactive test development and debugging:

```bash
# Terminal 1: Start backend E2E server
cd $(git rev-parse --show-toplevel)/apps/backend && rtk pnpm dev:e2e

# Terminal 2: From workspace root, run Playwright UI
cd $(git rev-parse --show-toplevel) && rtk pnpm test:e2e:ui
```

**In DevContainer**: There is no real display, so `pnpm test:e2e:ui` fails with “headed browser without having a XServer running”. Use the xvfb-backed script instead:

```bash
rtk pnpm test:e2e:ui:container
```

This runs Playwright UI under a virtual framebuffer (`xvfb-run`), so the headed browser works inside the container. Rebuild the devcontainer once after xvfb was added to the Dockerfile (e.g. “Rebuild Container” in VS Code).

### Run Specific Tests

From workspace root (run reseed + build + tests, or only Playwright if backend is already up):

```bash
# Terminal 1: Start backend E2E server (when developing)
cd $(git rev-parse --show-toplevel)/apps/backend && rtk pnpm dev:e2e

# Terminal 2: From workspace root, run specific test
cd $(git rev-parse --show-toplevel) && rtk pnpm test:e2e -- --grep "Signup Form"
```

## Viewing Traces Locally

### Generated Trace Location

After running tests, traces are stored in:

```
apps/frontend/test-results/
```

Each failed or retried test creates a directory like:

```
test-results/
└── TestName-TestDescription-e2e-retry1/
    ├── trace.zip
    ├── video.webm
    └── screenshots/
```

### View Traces in DevContainer

Use the `playwright-trace` command to view traces:

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend
rtk pnpm playwright-trace test-results/TestName-TestDescription-e2e-retry1/trace.zip
```

Or from workspace root:

```bash
rtk pnpm playwright-trace apps/frontend/test-results/TestName-TestDescription-e2e-retry1/trace.zip
```

This will start a web server on `http://localhost:9323`.

**Important**: The command runs in web server mode (not GUI) because we're in a DevContainer without a display server.

### View HTML Report

Playwright also generates an HTML report with embedded traces:

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend
rtk pnpm exec playwright show-report --host 0.0.0.0 --port 9323 playwright-report
```

Then open `http://localhost:9323` in your browser.

## Viewing CI Artifacts

When tests fail in CI/CD, you can download artifacts and view them locally.

### Step 1: Download Artifacts from GitLab CI

1. Go to your GitLab pipeline
2. Navigate to the failed `test-e2e:frontend` job
3. Click on **Browse** or **Download** artifacts
4. Download the `playwright-report` and/or `test-results` folders

### Step 2: Place Artifacts in Project

Extract the downloaded artifacts to the frontend directory:

```bash
# Extract to the correct location
cd /workspace/apps/frontend

# If you downloaded the full artifact zip
unzip ~/Downloads/artifacts.zip -d ./

# Or manually place them:
# - test-results/ → apps/frontend/test-results/
# - playwright-report/ → apps/frontend/playwright-report/
```

**Important**: Artifacts should be placed in `apps/frontend/`, not in the workspace root.

### Step 3: View CI Traces

After placing the artifacts, view them using the same commands:

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend

# View specific trace
pnpm playwright-trace test-results/TestName-TestDescription-e2e-retry1/trace.zip

# Or view HTML report
pnpm exec playwright show-report --host 0.0.0.0 --port 9323 playwright-report
```

Open `http://localhost:9323` in your browser.

## Trace Configuration

### Current Configuration

Located in `apps/frontend/playwright.config.ts`:

```typescript
use: {
  baseURL: "http://localhost:3000",
  trace: "on-first-retry",
  screenshot: {
    mode: "only-on-failure",
    fullPage: true
  },
  video: isCI ? "off" : "retain-on-failure",
  headless: true
}
```

### Trace Options

- `"on-first-retry"` (current): Only capture traces when a test retries
- `"on"`: Always capture traces (generates large artifacts)
- `"off"`: Never capture traces
- `"retain-on-failure"`: Capture on failure only

### Changing Trace Settings

To always capture traces (useful for debugging):

```typescript
use: {
  trace: "on",
}
```

To capture traces only on failure:

```typescript
use: {
  trace: "retain-on-failure",
}
```

## Troubleshooting

### Error: Protocol error (Browser.getVersion)

This error occurs when Playwright tries to open a GUI browser in the DevContainer.

**Solution**: Always use the `--host 0.0.0.0` flag for web server mode:

```bash
# ✅ Correct
rtk pnpm playwright-trace test-results/trace.zip

# ❌ Wrong (tries to open GUI)
rtk pnpm exec playwright show-trace test-results/trace.zip
```

### Traces Not Generated

If traces aren't being generated, check:

1. **Test is retrying or failing**: With `trace: "on-first-retry"`, traces are only created when tests retry
2. **Artifact paths**: Ensure `playwright.config.ts` has the correct output directories
3. **Disk space**: Large traces might fail silently if disk is full

### Port Already in Use

If port 9323 is already in use:

```bash
# Use a different port
cd $(git rev-parse --show-toplevel)/apps/frontend
rtk pnpm exec playwright show-trace --host 0.0.0.0 --port 9324 test-results/trace.zip
```

### Cannot Access Trace Viewer

Ensure the port is forwarded in your DevContainer:

Check `.devcontainer/devcontainer.json` includes:

```json
"forwardPorts": [3000, 3001, 9323]
```

### Missing Test Results

If `test-results/` is empty after running tests:

1. Check that tests actually failed or retried
2. Verify the `trace` configuration in `playwright.config.ts`
3. Run with verbose logging:

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend
DEBUG=pw:api rtk pnpm test:e2e
```

## Useful Commands Reference

```bash
# Install Playwright browsers (first time setup)
rtk pnpm install:playwright

# Start backend E2E server (keep running in separate terminal)
cd $(git rev-parse --show-toplevel)/apps/backend && rtk pnpm dev:e2e

# Run E2E tests (from root - build, reseed, then Playwright)
rtk pnpm test:e2e

# Run Playwright only (requires backend dev:e2e + prior pnpm build)
rtk pnpm test:e2e:run

# Clear caches and run full test:e2e
rtk pnpm test:e2e:clean

# Run E2E tests in UI mode (requires backend dev:e2e running separately)
rtk pnpm test:e2e:ui

# Run Playwright UI in DevContainer (uses xvfb; no host X server needed)
rtk pnpm test:e2e:ui:container

# View trace file
rtk pnpm playwright-trace apps/frontend/test-results/<test-name>/trace.zip

# View HTML report
cd $(git rev-parse --show-toplevel)/apps/frontend && \
  rtk pnpm exec playwright show-report --host 0.0.0.0 --port 9323 playwright-report

# Run specific test (requires backend dev:e2e running separately)
cd $(git rev-parse --show-toplevel)/apps/frontend && \
  rtk pnpm test:e2e -- --grep "test name"

# Run tests in headed mode (requires backend dev:e2e and X11)
cd $(git rev-parse --show-toplevel)/apps/frontend && \
  rtk pnpm test:e2e:headed
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Debugging Tests](https://playwright.dev/docs/debug)
