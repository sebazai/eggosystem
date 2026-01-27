---
name: run-tests
description: Run all tests (unit + E2E)
---

Run the complete test suite including both unit tests and E2E tests.

This runs `pnpm test:all` which:

1. Runs all unit tests (`pnpm test`)
2. Reseeds the database for E2E tests
3. Builds the project
4. Runs E2E tests
