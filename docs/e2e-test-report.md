# E2E Test Report

Overview of end-to-end tests: paths covered, assertions, and how external APIs are mocked.

## Test Layout

- **Runner:** Playwright (`apps/frontend/playwright.config.ts`)
- **Location:** `apps/frontend/src/e2e/*.spec.ts`
- **Base URL:** `http://localhost:3000`
- **Server:** `pnpm start:standalone` (or equivalent) during `pnpm test:e2e`

## Spec Files and Paths Covered

| Spec File                 | Paths Under Test                                             | Auth                            |
| ------------------------- | ------------------------------------------------------------ | ------------------------------- |
| **SignupForm.spec.ts**    | `/`, `/seasons/16/signup`, `/seasons/16/signup/registration` | JWT (heppajpg / various; admin) |
| **AddPlayer.spec.ts**     | `/dashboard/players/add?season=14`                           | JWT (heppajpg; admin)           |
| **Accessibility.spec.ts** | `/`, `/matches`, `/matches/10154`                            | None                            |
| **VerifyEmail.spec.ts**   | `/verify-email` (with `?token=...`)                          | None                            |
| **Kanahautomo.spec.ts**   | `/kanahautomo`                                               | JWT (heppajpg; admin)           |

### SignupForm.spec.ts

- **Paths:** `/`, `/seasons/16/signup`, `/seasons/16/signup/registration`
- **Focus:** Season registration: org/team choice, FACEIT team ID, lineup, Steam IDs, captain/co-captain, validation, submission.
- **Assertions:** Login hidden when authenticated, “Season registration” heading, required-field validation, FACEIT UUID validation (empty, bad format, HTTP prefix, valid), Steam ID validation (hours, organizer approval, nickname search, “not found”), external rank error, captain/co-captain rules, full submit flow and POST to `/api/v1/registrations/season/...`.

### AddPlayer.spec.ts

- **Paths:** `/dashboard/players/add?season=14`
- **Focus:** Dashboard “add player”: validate player, pick team, check eligibility, add player.
- **Assertions:** “Add player” heading, season “CS2 Season 2”, validate-player → eligibility → add-player flow, success/error states, form validation (validate button disabled until Steam ID). Additional **request-level** tests call dashboard APIs directly with `request.get/post` and assert response shape (eligibility, add, reject ineligible).

### Accessibility.spec.ts

- **Paths:** `/`, `/matches`, `/matches/10154`
- **Focus:** axe-core accessibility; no auth, no mocking.
- **Assertions:** Violation counts/types stay within baselines for home, matches list, and match detail.

### VerifyEmail.spec.ts

- **Path:** `/verify-email` with `?token=...`
- **Focus:** Email verification against backend (success, invalid, expired, missing token, loading, multiple tokens, UI/styling, navigation).
- **Assertions:** Success/error cards, icons, “Go to Home” / “Edit your Email”, toast content, navigation to `/` or `/profile`, loading text. Uses seeded tokens (e.g. `valid-token-123`, `bug-test-redis-token`, `invalid-token-xyz`).

### Kanahautomo.spec.ts

- **Path:** `/kanahautomo`
- **Focus:** Kanahautomo registration: org dropdown, game types, terms, new org form.
- **Assertions:** Combobox and “Join Kanahautomo”, org “E2E Test Organization”, validation (empty, new org, game types, terms), POST to `/api/v1/kanahautomo/register-with-organization`, loading and error UI.

## Mocking External APIs in E2E

E2E tests do **not** use MSW. External and third-party calls are stubbed with **Playwright route interception** (`page.route()` / `route.fulfill()`).

### Where Mocking Happens

| Spec           | What Is Mocked                                                                                                                                               | How                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SignupForm** | `**/api/v1/faceit/teams/*`                                                                                                                                   | `page.route()` → JSON body (team_id from URL, name, avatar, etc.). Draft requests get `Authorization: Bearer <JWT>` via `page.route("**/draft", ...)` + `route.continue({ headers })`.                    |
| **AddPlayer**  | `**/api.steampowered.com/ISteamUser/GetPlayerSummaries/**`, `**/api.steampowered.com/IPlayerService/GetOwnedGames/**`, `**/api.faceit.com/data/v4/players**` | `page.route()` + `route.fulfill()` with fixed JSON (e.g. Steam profile, CS2 hours, FACEIT elo/skill_level). Internal `**/api/v1/**` get Bearer via `route.continue({ headers })` only (no response mock). |

SignupForm and AddPlayer use **real backend** for app-owned APIs; only third-party URLs (Steam, FACEIT) and the FACEIT teams proxy are mocked in-browser. VerifyEmail, Accessibility, and Kanahautomo hit the real backend with no route mocks (Kanahautomo only adds Bearer via `page.route("**/api/**", ...)`).

### MSW vs E2E

- **MSW** (`@eggosystem/shared-msw`): used in **backend** and **frontend component/integration** tests to mock external services (Steam, FACEIT, Leetify, Csrankker). Not used in Playwright e2e specs.
- **E2E**: external APIs are mocked with **Playwright** `page.route()` so the browser never hits live Steam/FACEIT. The skill “eggosystem-msw” recommends MSW for integration/E2E in general; in this codebase, Playwright route interception is what’s implemented for e2e.

### E2E Test Data and Backend

- **Seeds:** `apps/backend/seeds/e2e_test_seed.ts` (season 16, org/team 999, accounts 15xxx, etc.).
- **Fixtures:** `packages/types/src/test/e2e-test-data.ts` and `fixtures` (e.g. `heppajpgSteamId`, `ValidWorkEmail1SteamId`, `NoFaceitRankPlayerSteamId`). Same identities are used by backend and e2e.
- **JWTs:** `apps/frontend/src/e2e/utils/index.ts` — `generateTestJWT()` / `generateTestJWTForUser()` build RS256 JWTs using `apps/backend/private_access_token.pem`. Backend must be run with a config that accepts these tokens (e.g. `pnpm dev:e2e`).

## Paths Not Covered by E2E

E2E does **not** systematically cover:

- Other dashboard routes (e.g. `/dashboard`, `/dashboard/teams`, `/dashboard/players` list).
- Other season signup URLs (e.g. seasons other than 16).
- Profile, settings, or other authenticated pages besides signup, add-player, and Kanahautomo.
- Unauthenticated access to protected routes (only AddPlayer/SignupForm/Kanahautomo assert “logged-in” behavior).
- All public routes (e.g. `/matches` is only used for accessibility).

## Running E2E

Always run E2E from workspace root:

```bash
# Full run (build + reseed + Playwright)
cd $(git rev-parse --show-toplevel) && pnpm test:e2e
```

When developing, start the backend first, then from workspace root run Playwright only (skips reseed):

```bash
# Terminal 1: Backend (accepts E2E JWT)
cd $(git rev-parse --show-toplevel)/apps/backend && pnpm dev:e2e

# Terminal 2: From workspace root, run Playwright only
cd $(git rev-parse --show-toplevel) && pnpm build && pnpm test:e2e:run
```

See `playwright.config.ts` for `webServer`, timeouts, and reporters.
