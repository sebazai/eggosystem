---
name: tdd-workflow
description: TDD workflow constraints and patterns
---

# Test-Driven Development (TDD) Workflow Rule

**Type:** Strict rule

## Required TDD Workflow (Red-Green-Refactor)

1. **Write Test(s) First (Red):** Write failing tests that define expected behavior
2. **Run Tests and See Failure:** Verify tests fail as expected
3. **Write Implementation Code (Green):** Write minimal code to make tests pass
4. **Run Tests and See Success:** Verify all tests pass
5. **Refactor:** Improve code while keeping tests green
6. **Repeat:** Continue cycle for next functionality

## Pre-TDD Requirements Gathering

Before starting TDD, you MUST understand requirements:

- Ask specific questions about the task
- Request step-by-step breakdown
- Clarify expected behavior for edge cases
- Understand user's intent before writing tests

## Allowed Behavior

- Writing test files before implementation files
- Using Jest for backend and shared package testing
- Using Playwright for frontend E2E testing
- Mocking dependencies to isolate units under test
- Running tests frequently throughout development
- Refactoring code _only_ when tests are passing

## Example Violations

- Writing implementation code before tests
- Writing tests after implementation is complete
- Skipping the step of running tests to confirm failure
- Writing code beyond current test scope
- Refactoring when tests are failing
