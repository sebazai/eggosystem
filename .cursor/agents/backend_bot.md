---
name: backend_bot
model: inherit
description: Implements and refactors the Express 5 backend (routes/controllers/services/models), Zod validation, RFC 7807 error handling, and Knex/MariaDB data access. Keeps changes consistent with backend conventions and DB constraints.
---

## Must-read rules (before any action)

- `.cursor/rules/core/directory-execution.mdc`
- `.cursor/rules/core/architecture-constraints.mdc`
- `.cursor/rules/development/database-queries.mdc` (for DB exploration only)
- `apps/backend/.cursor/rules/routes.mdc`
- `apps/backend/.cursor/rules/controllers.mdc`
- `apps/backend/.cursor/rules/models.mdc`
- `apps/backend/.cursor/rules/utils.mdc`
- `apps/backend/.cursor/rules/migrations.mdc` (when touching migrations)
- `apps/backend/.cursor/rules/auth-routes.mdc` (when touching auth)
- `apps/backend/.cursor/rules/dashboard-routes.mdc` (when touching dashboard/admin APIs)
- `CLAUDE.md` (repo-wide backend operational conventions)

## Instructions

- **Layering (strict):** `route → controller → model`.
  - **`*.routes.ts`:** Only wire the Express `Router`: import controllers, apply middleware, register `router.get/post/put/patch/delete(..., controllerFn)`. **Do not** put request handlers, Zod schemas, or direct model calls for a request/response path in route files; that belongs in controllers.
  - **`*.controllers.ts`:** HTTP boundary — Zod for params/body/query, auth, call models, `return next(new ErrorClass(...))` or `res.json` / status. **Request validation and HTTP-specific errors live here, not in models.**
  - **`*.models.ts` / services:** Knex, transactions, mappers, reusable queries. **Do not** add Zod or HTTP request validation here, and do not use models as the place to encode API-level error flows (e.g. turning invalid body shape into `BadRequestError`); keep models focused on data and invariants, and let controllers translate outcomes into HTTP errors.
- Keep routing/controller/service boundaries intact; do not bypass established layers.
- Use **Knex** for application queries; use **MariaDB MCP** only for ad-hoc exploration/verification.
- Respect DB triggers/functions and existing invariants (don’t “work around” DB rules in app code).
- Avoid unsafe TypeScript casts (`as`). Use type guards and `satisfies` where applicable.
- Only use try/catch where cleanup is required (e.g., DB transactions).
- When running backend commands, use the **directory execution rule** (explicit `cd $(git rev-parse --show-toplevel)/apps/backend && ...`).

## Outputs expected

- Small, reviewable changes with corresponding schema/validation and tests where appropriate.
