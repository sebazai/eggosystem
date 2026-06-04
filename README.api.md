# Backend API Documentation

This document describes the Express 5 + TypeScript backend API for Kanaliiga Eggosystem. It is a reference for route layout, authentication, error format, and the middleware conventions used across `apps/backend`.

## API Architecture

- **Entry**: `apps/backend/src/app.ts`
- **Base URL**: `http://localhost:3001/api/v1` (dev) / production API host under the same `/api/v1` prefix
- **Versioning**: URL-path versioning (`/api/v1/`) — the single v1 router is assembled in `apps/backend/src/routes/index.ts`
- **Body parser**: `express.json({ limit: "10mb" })` (image uploads)
- **Security middleware**: `helmet()` applied globally
- **CORS**: `cors({ origin: true, credentials: true })` applied globally; a stricter `corsMiddleware` is additionally attached to most authenticated mount points (`/auth`, `/accounts`, `/dashboard`, `/registrations`, `/faceit`, etc.)
- **Cookies**: `cookie-parser` middleware is enabled; auth tokens are delivered as cookies
- **Request logging**: `morgan("dev")` — skipped for `/api/v1/health`
- **Error format**: RFC 7807 Problem Details (see below)

No global rate limiter is installed; endpoint-level rate limiting (e.g., the BullMQ `welcome-emails` queue) is implemented inside specific services.

## Authentication and Authorization

### Authentication Methods

#### 1. JWT Authentication

Primary method for user-facing endpoints. RSA-signed (RS256) access and refresh tokens issued after Steam OpenID login. Keys live in `apps/backend/private_*_token.pem` / `public_*_token.pem`.

**Cookie (default)**:

```
access_token=<jwt>      // HttpOnly, sameSite=strict, secure in production, path=/
refresh_token=<jwt>     // HttpOnly, sameSite=strict, secure in production,
                        // scoped to /api/v1/auth/refresh and /api/v1/auth/logout
```

**Authorization header (also supported)**:

```
Authorization: Bearer <jwt>
```

**Middleware**: `authenticateJWT` (in `apps/backend/src/middlewares/auth.middleware.ts`). Reads the `Authorization: Bearer …` header first, falls back to the `access_token` cookie.

#### 2. API Key Authentication

Service-to-service authentication. Currently used by the ELO stabilizer endpoint.

**Header**:

```
x-api-key: <api_key>
```

**Middleware**: `createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY)` (in `api-key-auth.middleware.ts`).

### Auth Endpoints (`/api/v1/auth`, mounted with `corsMiddleware`)

| Method | Path                     | Auth           | Purpose                                                    |
| ------ | ------------------------ | -------------- | ---------------------------------------------------------- |
| GET    | `/auth/steam`            | public         | Start Steam OpenID flow; optional `?returnUrl=` cookie set |
| GET    | `/auth/steam/return`     | public         | Steam OpenID callback; issues JWT cookies and redirects    |
| POST   | `/auth/refresh`          | refresh cookie | Rotate access + refresh tokens                             |
| GET    | `/auth/logout`           | refresh cookie | Revoke refresh token in Redis and clear cookies            |
| GET    | `/auth/me`               | JWT            | Return the authenticated user payload (`UserFullPayload`)  |
| GET    | `/auth/discord/login`    | JWT            | Start Discord OAuth flow to link the caller's account      |
| GET    | `/auth/discord/callback` | state token    | Discord OAuth callback; links `discord_id` to the account  |

Refresh tokens are stored in Redis keyed by `jti`; `/auth/refresh` validates the stored token, regenerates both tokens, and overwrites the Redis entry.

### Authorization Patterns

Authorization is enforced via `checkPermissions` (DB/Redis-backed) or `checkJWTPermissions` (stateless, reads permissions from the JWT claims). Both accept the same shape:

#### 1. Role-Based (fallback roles)

```typescript
checkPermissions({ fallbackRoles: ["admin", "helpdesk"] });
```

#### 2. Static permissions

```typescript
checkPermissions({
  staticPermissions: ["read:dashboard"],
  fallbackRoles: ["admin"]
});
```

#### 3. Dynamic (scoped) permissions

```typescript
checkPermissions({
  role: "captain",
  action: "edit-registration",
  paramKeys: ["season_id", "team_id"]
});
// Resolves to "captain:edit-registration:season-<id>:team-<id>"
```

The dashboard mount (`/api/v1/dashboard`) layers `corsMiddleware + authenticateJWT` globally, then each sub-router adds its own `checkPermissions({ fallbackRoles: [...] })`.

## API Endpoints

All v1 routers are mounted from `apps/backend/src/routes/index.ts`. High-level groups:

| Mount                                                                | Router file                                 | Auth                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/auth`                                                              | `auth.routes.ts`                            | `corsMiddleware`; per-endpoint JWT                                                                   |
| `/app`                                                               | `app.routes.ts`                             | public                                                                                               |
| `/accounts`                                                          | `account.routes.ts`                         | `corsMiddleware` + `authenticateJWT`                                                                 |
| `/accounts/unsubscribe/:token`                                       | (inline in `routes/index.ts`)               | public (GET and POST)                                                                                |
| `/dashboard/*`                                                       | `dashboard/index.ts`                        | `corsMiddleware` + `authenticateJWT` + `checkPermissions` per subroute                               |
| `/kanahautomo`                                                       | `kanahautomo.routes.ts`                     | `corsMiddleware`; per-endpoint JWT                                                                   |
| `/discord`                                                           | `discord.routes.ts`                         | `corsMiddleware`                                                                                     |
| `/verify-email`                                                      | `account.controllers#verifyEmailController` | `corsMiddleware` (POST)                                                                              |
| `/reservations/remove` (POST, JSON body `{ "token": "<64 hex>" }`)   | `match-streams.controllers`                 | `corsMiddleware` (public removal token)                                                              |
| `/registrations`                                                     | `season-team-registration.routes.ts`        | `corsMiddleware`                                                                                     |
| `/faceit`                                                            | `faceit.routes.ts`                          | `corsMiddleware`                                                                                     |
| `/players`                                                           | `player.routes.ts`                          | public / JWT per endpoint                                                                            |
| `/calendar`                                                          | `calendar.routes.ts`                        | public / JWT per endpoint                                                                            |
| `/organizers`                                                        | `organizer.routes.ts`                       | public / JWT per endpoint                                                                            |
| `/caster-applications`                                               | `caster-applications.routes.ts`             | `corsMiddleware` + `authenticateJWT`                                                                 |
| `/casters`                                                           | `caster.routes.ts`                          | public                                                                                               |
| `/matches`                                                           | `match.routes.ts`                           | public / JWT per endpoint                                                                            |
| `/match-games`                                                       | `match-game.routes.ts`                      | public / JWT per endpoint                                                                            |
| `/games`                                                             | `game.routes.ts`                            | public                                                                                               |
| `/organizations`                                                     | `organization.routes.ts`                    | public / JWT per endpoint                                                                            |
| `/filters`                                                           | `filter.routes.ts`                          | public; wrapped by `parseQueryFilterParams` + `cacheResponseMiddleware({ cachePrefix: "filtered" })` |
| `/maps`                                                              | `map.routes.ts`                             | public                                                                                               |
| `/teams`                                                             | `team.routes.ts`                            | public / JWT per endpoint                                                                            |
| `/seasons`                                                           | `season.routes.ts`                          | public / JWT + `checkJWTPermissions` per endpoint                                                    |
| `/leagues`                                                           | `league.routes.ts`                          | public                                                                                               |
| `/tournaments`                                                       | `tournament.routes.ts`                      | public                                                                                               |
| `/now`                                                               | `now.routes.ts`                             | public (returns `{ now: <epoch_ms> }`)                                                               |
| `/allstar`                                                           | `allstar.routes.ts`                         | public / JWT per endpoint                                                                            |
| `/stages`                                                            | `stage.routes.ts`                           | public                                                                                               |
| `/elo`                                                               | `elo.routes.ts`                             | API key (`x-api-key`)                                                                                |
| `/standings`                                                         | `standings.routes.ts`                       | public                                                                                               |
| `/hall-of-fame`                                                      | `hall-of-fame.routes.ts`                    | public                                                                                               |
| `/season-results`                                                    | `season-results.routes.ts`                  | public                                                                                               |
| `/sponsors`                                                          | `sponsors.routes.ts`                        | public; grouped marketing sponsors for the website (see below)                                       |
| `/stats`                                                             | inline in `routes/index.ts`                 | public, cached 24h                                                                                   |
| `/health`, `/health/discord`, `/health/rabbitmq`, `/health/database` | inline                                      | public                                                                                               |

### Dashboard Sub-Routes (`/api/v1/dashboard/*`)

Each subroute is additionally gated by `checkPermissions({ fallbackRoles: [...] })`:

| Subroute                          | Fallback roles                            |
| --------------------------------- | ----------------------------------------- |
| `/dashboard/seasons`              | `admin`, `helpdesk`                       |
| `/dashboard/players`              | `admin`, `helpdesk`                       |
| `/dashboard/teams`                | `admin`, `helpdesk`                       |
| `/dashboard/organizations`        | `admin`, `helpdesk`                       |
| `/dashboard/registration`         | `admin`, `helpdesk`                       |
| `/dashboard/sortter`              | `admin`                                   |
| `/dashboard/matches`              | `admin`, `helpdesk`                       |
| `/dashboard/role-management`      | `admin`, `helpdesk`                       |
| `/dashboard/redis`                | `admin`, `helpdesk`                       |
| `/dashboard/demos`                | `admin`, `helpdesk`                       |
| `/dashboard/season-league-mapper` | `admin`                                   |
| `/dashboard/faceit-validation`    | `admin`, `helpdesk`                       |
| `/dashboard/email-verification`   | `admin`, `helpdesk`                       |
| `/dashboard/caster-applications`  | `admin`, `helpdesk`                       |
| `/dashboard/playoff-seeds`        | `admin`, `helpdesk`                       |
| `/dashboard/sponsors`             | `admin` only                              |
| `/dashboard/newsletter`           | `admin` only                              |
| `GET /dashboard`                  | static `read:dashboard`; fallback `admin` |

### Public marketing sponsors (`GET /api/v1/sponsors`)

Anonymous read used by the public Next.js site (frontpage + footer). Response shape:

- `game_wide_sponsors`, `main_partners`, `supporting_organizations`: arrays of `{ id, display_name, external_url, display_order, image_phash }`
- `image_phash` is the stable image-service reference (same resolution pattern as team logos: `GET {IMAGE_SERVICE_URL}/images/by-hash/phash/{image_phash}`).

**Caching**

- HTTP `Cache-Control: public, max-age=300` (5 minutes), aligned with short-lived marketing updates.
- The backend also keeps a Redis cache entry with the same TTL family (see `marketing-sponsors.services.ts`).

This is intentionally shorter than `GET /api/v1/stats` (`max-age=86400`) because sponsor rows change more often than aggregate counters.

**Admin writes**

- `POST /api/v1/dashboard/sponsors` — create (optional `image_data` base64 / data URI, validated like team logo uploads).
- `PATCH /api/v1/dashboard/sponsors/:id` — update fields / replace image.
- `DELETE /api/v1/dashboard/sponsors/:id` — remove row.
- `PUT /api/v1/dashboard/sponsors/reorder` — body `{ tier, ordered_ids }` listing every sponsor id in that tier in display order.

Failures on these mutations are returned as RFC 7807 `application/problem+json` via the global error handler.

### Filter Query Parameters

The `/filters/*` endpoints share the `parseQueryFilterParams` middleware. Supported query params (comma-separated where applicable):

- `season_ids`, `league_ids`, `team_ids`, `stages`, `map_ids`
- `steamId`, `player_name` (text filters used by `/filters` cross-dimension endpoint)

## REST Conventions

### Explicit Resource Identifiers

Always use explicit resource identifiers (`season_id`, `team_id`, `player_id`) in paths or bodies — never infer a resource from an "active" state.

**Good**:

```typescript
POST /api/v1/dashboard/registration/season/:season_id/bulk-approve

POST /api/v1/dashboard/registration/approved
{ "season_id": 17, "teamId": 123, ... }
```

**Bad**:

```typescript
// Don't infer season from "active" state
POST / api / v1 / dashboard / registration / bulk - approve;
```

Why:

1. **Multi-Organizer Support**: Explicit identifiers allow the system to work with multiple organizers without ambiguity
2. **Testability**: Explicit parameters make endpoints easier to test with specific scenarios
3. **Clarity**: API consumers know exactly which resource they're operating on
4. **REST Compliance**: Follows REST principles where resources are identified by unique identifiers
5. **No Implicit Dependencies**: Avoids hidden dependencies on database state or time-based conditions

### Resource Inference Pattern

When you have a resource identifier (e.g., `season_id`), you can infer related data:

```typescript
// ✅ Good: Use season_id to fetch related data
const seasonId = Number(req.params.season_id);
const season = await getSeasonById(seasonId);
// Now you have: app_id, game_id, organizer_id, platform, etc.
```

## Middleware Reference

### Authentication

- `authenticateJWT` — JWT validation (cookie or `Authorization` header), RS256 against `JWT_PUBLIC_KEY`
- `createApiKeyValidator(expected)` — `x-api-key` header validator

### Authorization

- `checkPermissions` — DB/Redis-backed permission + role check (stateful)
- `checkJWTPermissions` — stateless check against JWT-carried permissions and roles

### Utility

- `corsMiddleware` — stricter CORS policy on top of the global `cors()`
- `parseQueryFilterParams` — parses and normalizes `/filters` query strings into `req.parsedParams`
- `cacheResponseMiddleware({ cachePrefix })` — Redis-backed response caching for filter endpoints
- `validateNumericParams([...names])` — rejects non-numeric route params with 400

## Request Validation

Zod is the preferred validator. A small `src/schemas/` directory holds shared schemas (e.g., `caster-applications.schemas.ts`), but many controllers inline `z.object({ ... }).parse(req.body)` as needed. `ZodError` is caught centrally by `expressErrorHandler` and returned as a 400 Problem Details response with an `issues` extension.

Example — caster application submit body:

```typescript
z.object({
  caster_url: z.string().url().min(1),
  approved_terms_and_conditions: z.boolean().refine((v) => v === true)
});
```

## Error Handling

The central error handler is `apps/backend/src/middlewares/express-error-handler.ts`. All responses use `Content-Type: application/problem+json` and the RFC 7807 shape:

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "<human-readable message>",
  "instance": "<req.originalUrl>"
}
```

Extensions:

- `ZodError` → 400 with an `issues` array appended
- Known DB errors (duplicate entry, trigger errors) are converted by `convertDatabaseErrorToConflictError` → 409 with a specific `title`
- `UnauthorizedError`-like errors from `express-jwt` are mapped to 401
- CORS rejections ("Not allowed by CORS") return 500

Common statuses: `400`, `401`, `403`, `404`, `405`, `409`, `422`, `429`, `500`, `502`, `503`.

Controllers should `return next(new BadRequestError(...))` etc. (from `utils/errors`); services throw and let errors bubble.

## Security Notes

- HTTPS + `secure` cookies in production (`NODE_ENV === "production"`)
- JWTs signed RS256 with an RSA key pair under `apps/backend/private_*_token.pem` / `public_*_token.pem`
- Refresh tokens are stored in Redis keyed by `jti`; `/auth/logout` deletes the entry
- Principle of least privilege via role + scoped-permission checks
- Input validation via Zod + `validateNumericParams`
- Dedicated `auth.test.ts` files colocated with routers cover 401/403/200 paths

## Testing

- Unit tests (Jest + Supertest) live next to code; create apps with `createExpressTestApp(router, mountPath)` from `src/test-utils` and always run the returned `cleanup()` in `afterEach`.
- E2E tests (Playwright) must be run from the repo root: `pnpm test:e2e`. See the [Testing section in the root README](README.md#testing).

## Performance

- Filter endpoints are cached via `cacheResponseMiddleware` (Redis, prefix `filtered`)
- `/stats` landing-page statistics response is cached with `Cache-Control: public, max-age=86400`
- DB connection pool health is exposed at `/api/v1/health/database`

## Related Documentation

- [Architecture](README.architecture.md) — monorepo, Turbo graph, app boundaries
- [Database](README.database.md) — Knex, migrations, triggers, identity model
- [Dashboard](README.dashboard.md) — admin/helpdesk UI and its security model
- [Frontend](README.frontend.md) — Next.js App Router + SWR integration
- [Testing](README.md#testing) — unit/integration (Jest) and E2E (Playwright, from repo root)
