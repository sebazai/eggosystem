---
name: E2E Test Plan Execution
overview: "Step-by-step execution plan for the E2E critical-workflows plan: unique Steam IDs per major test, e2e seeds required, shared-msw updates so new users are mocked correctly, and implementation order."
todos:
  - id: types-fixtures
    content: Add 4 Steam ID constants (DraftReturnUserSteamId, ApprovalOnlySubmitSteamId, ManualApprovalTargetSteamId, ManualRankTargetSteamId) to packages/types/src/test/fixtures.ts using range 66561198999999925–66561198999999928
    status: completed
  - id: types-e2e-data
    content: Add 4 entries to e2eSteamPlayerData in packages/types/src/test/e2e-test-data.ts with correct account_id (15022–15025), work_email/work_email_verified per workflow (S2/S3/A1/A2)
    status: completed
  - id: types-export
    content: Ensure new Steam ID constants are exported from packages/types so shared-msw and e2e can import them
    status: completed
  - id: checkpoint-e2e-baseline
    content: Run pnpm test:e2e from repo root (or apps/frontend) and fix any failures; establishes baseline before seed/MSW changes
    status: completed
  - id: msw-game-rank
    content: In packages/shared-msw/src/faceit/GameRank-handlers.ts add if (gamePlayerId === X) branches for DraftReturnUserSteamId, ApprovalOnlySubmitSteamId, ManualApprovalTargetSteamId, ManualRankTargetSteamId returning createFaceitRank(..., 1500, 10)
    status: completed
  - id: msw-metadata
    content: In packages/shared-msw/src/faceit/Metadata-handlers.ts add branches for the 4 new Steam IDs if signup/dashboard calls FACEIT metadata for them (or defer)
    status: completed
  - id: msw-owned-games
    content: In packages/shared-msw/src/steam/GetOwnedGames-handlers.ts add special cases only if any new ID needs no-hours or different hours; else rely on e2eSteamPlayerData
    status: completed
  - id: checkpoint-build
    content: Run pnpm typecheck and backend unit tests that use MSW to ensure types and shared-msw build and existing tests still pass
    status: completed
  - id: seed-accounts
    content: Add the 4 new Steam IDs to e2eSteamPlayerData in packages/types so the e2e seed's existing loop (apps/backend/seeds/e2e_test_seed.ts) creates Account, SteamPlayer, and LinkedAccount for them
    status: completed
  - id: seed-approval-s3
    content: In e2e_test_seed add SeasonPlayerApprovals row for ApprovalOnlySubmitSteamId (season_id=16, team_id=999); ensure that account has work_email null / work_email_verified 0
    status: completed
  - id: seed-no-approval-a1
    content: Ensure ManualApprovalTargetSteamId has no SeasonPlayerApprovals row in seed (test adds it via admin form)
    status: completed
  - id: seed-no-rank-a2
    content: Ensure ManualRankTargetSteamId has no SeasonPlayerRanks row for season 16 in seed (test adds it via admin rank form)
    status: completed
  - id: checkpoint-e2e-after-seed
    content: Run pnpm test:e2e again after seed changes; fix any failures before adding new specs
    status: completed
  - id: e2e-s3-approval-only
    content: In SignupForm.spec add test that fills lineup including ApprovalOnlySubmitSteamId, assigns captain/co-captain, accepts terms, submits, asserts success
    status: completed
  - id: checkpoint-e2e-s3
    content: Run pnpm test:e2e (e.g. SignupForm.spec or full) and fix failures after S3 test
    status: in_progress
  - id: e2e-s2-draft-return
    content: In SignupForm.spec add test that saves draft as DraftReturnUserSteamId (or heppajpg), re-opens registration, asserts form prefilled from draft, then submits or saves again
    status: pending
  - id: checkpoint-e2e-s2
    content: Run pnpm test:e2e and fix failures after S2 test
    status: pending
  - id: e2e-a1-spec
    content: Create DashboardRegistration.spec (or new describe in existing spec); add A1 test – as admin (generateTestJWTForUser with heppajpg/admin or see playwright-mcp-admin-auth.mdc), add manual approval for org/team + ManualApprovalTargetSteamId, then as user complete signup with that ID, assert submit succeeds
    status: pending
  - id: e2e-a1-mocks
    content: Add Playwright page.route mocks for Steam/FACEIT for ManualApprovalTargetSteamId in A1 test so responses match shared-msw contract
    status: pending
  - id: checkpoint-e2e-a1
    content: Run pnpm test:e2e and fix failures after A1 test
    status: pending
  - id: e2e-a2-spec
    content: Add A2 test – as admin (generateTestJWTForUser with heppajpg/admin or see playwright-mcp-admin-auth.mdc), add manual rank for ManualRankTargetSteamId (season 16), then as user add that ID in registration, complete form, submit, assert success
    status: pending
  - id: e2e-a2-mocks
    content: Add Playwright page.route mocks for ManualRankTargetSteamId in A2 test (Steam profile/hours, FACEIT rank) to match shared-msw
    status: pending
  - id: checkpoint-e2e-a2
    content: Run pnpm test:e2e and fix failures after A2 test
    status: pending
  - id: e2e-a3-a4-spec
    content: Add A3/A4 tests – open /dashboard/registration/registered, select season, assert teams/drafts load; bulk-approve (A3) and set manual validity (A4), assert UI/state; use existing seed (team 999, season 16)
    status: pending
  - id: checkpoint-e2e-a3a4
    content: Run pnpm test:e2e and fix failures after A3/A4 tests
    status: pending
  - id: e2e-a5-spec
    content: Add A5 test – open /dashboard/registration/add-team, select season, fill SignupForm (org/team/5 players/captains), submit, assert POST to admin signup and success; reuse ValidWorkEmail/heppajpg or dedicated IDs
    status: pending
  - id: checkpoint-e2e-full
    content: Run full pnpm test:e2e and fix any remaining failures; verify S2, S3, A1, A2, A3, A4, A5 all pass
    status: pending
isProject: false
---

# E2E Test Plan – Execution: Seeds, Steam IDs, MSW, Order

This plan answers: **How do we execute the critical-workflows e2e plan?** It covers (1) which e2e seeds we need, (2) unique Steam IDs per major test and why, (3) how to keep shared-msw in sync when adding new users, and (4) a strict implementation order so nothing is missed.

**Execution order for agents:** Complete the frontmatter `todos` in list order. Each todo with id `checkpoint-*` means run `pnpm test:e2e` (from repo root or `cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm test:e2e` when running from frontend, per directory-execution rules) and fix any failures before continuing. Do not skip checkpoints.

**Prerequisites:** For local runs, ensure the backend is running with `cd $(git rev-parse --show-toplevel)/apps/backend && pnpm dev:e2e` (or rely on CI to start it), so API calls during E2E succeed.

---

## 1. Data flow and why “unique Steam IDs” and “MSW” matter

**Flow today:**

- **E2E (Playwright):** Browser calls backend; external calls (Steam/FACEIT) are mocked in-browser via `page.route()`. Backend runs real code and uses **e2e seed** data (DB).
- **Backend/component tests:** Use **MSW** (`@eggosystem/shared-msw`). Handlers key off `e2eSteamPlayerData` (Steam) or explicit Steam IDs (FACEIT GameRank/Metadata).

**Important:** When we add a **new** Steam ID for a major e2e test, we must:

1. Add it to **types** (fixtures + e2e-test-data) and **e2e seed** so the DB knows the user.
2. Add or extend **shared-msw** handlers so that ID is handled like the others (GetPlayerSummaries, GetOwnedGames, FACEIT GameRank/Metadata).  
   That keeps backend/component tests and any future MSW-based e2e consistent, and defines a single “contract” for that ID.

**Why unique IDs per major test:**
Reusing the same Steam ID across S2, S3, A1, A2, etc. can cause cross-test effects (e.g. draft/approval/rank from one test affecting another). One dedicated ID per major workflow avoids that.

---

## 2. Steam ID and seed inventory for new workflows

Use a **new range** for “major test” IDs so they don’t collide with existing fixtures. Current e2e IDs in [packages/types/src/test/fixtures.ts](packages/types/src/test/fixtures.ts) use `66561198999999901`–`66561198999999924` and two `76561198...` IDs. Reserve **66561198999999925–66561198999999935** for the new workflows.

| Workflow                                    | Plan ID | Purpose                                                                                   | New Steam ID constant         | Account ID | Notes                                                                                                                                       |
| ------------------------------------------- | ------- | ----------------------------------------------------------------------------------------- | ----------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Draft return                                | S2      | User saves draft, re-opens registration, form prefilled                                   | `DraftReturnUserSteamId`      | 15022      | Can reuse heppajpg/ValidWorkEmail1 if we isolate by test name; **recommended:** dedicated ID to avoid draft collisions.                     |
| Approval-only submit                        | S3      | Submit succeeds with player who has **no** work email but **is** in SeasonPlayerApprovals | `ApprovalOnlySubmitSteamId`   | 15023      | Must have no work email, must be in SeasonPlayerApprovals for season 16 + org/team.                                                         |
| Manual approval then signup                 | A1      | Admin adds approval for org/team + Steam ID; user signs up with that ID                   | `ManualApprovalTargetSteamId` | 15024      | New ID, not in any team/approval initially; admin approves; then user uses it in signup.                                                    |
| Manual rank then signup                     | A2      | Admin adds manual rank for Steam ID; user adds that ID in lineup, submit succeeds         | `ManualRankTargetSteamId`     | 15025      | No SeasonPlayerRanks initially; admin adds via rank form; then used in registration.                                                        |
| Registered / bulk approve / manual validity | A3, A4  | Admin sees teams/drafts, bulk-approves or sets manual validity                            | _(no new Steam ID)_           | –          | Use existing seed: season 16, team 999, existing registrations/drafts. Optionally add a second team “invalid until manual validity” for A4. |
| Add-team signup (admin)                     | A5      | Admin submits full signup for a team                                                      | _(no new Steam ID)_           | –          | Reuse ValidWorkEmail1–5 or heppajpg for the 5 players; or add `AddTeamSignupSteamId1`–`5` for strict isolation.                             |

**Recommendation:** Introduce **four** new IDs for S2, S3, A1, A2. For A3/A4 use existing seed data; for A5 reuse existing ValidWorkEmail/heppajpg unless you want total isolation, in which case add `AddTeamSignupSteamId1`–`5`.

---

## 3. E2E seeds we need (by workflow)

**Existing:** [apps/backend/seeds/e2e_test_seed.ts](apps/backend/seeds/e2e_test_seed.ts) already provides season 16, org/team 999, Quattra/Trev approval setup, ValidWorkEmail\*, etc.

**To add or verify:**

- **S2 (draft return):** No extra seed if we reuse heppajpg. If we add `DraftReturnUserSteamId`, seed must create Account + SteamPlayer + LinkedAccount (the loop over `e2eSteamPlayerData` does this as soon as the ID is in `e2eSteamPlayerData`).
- **S3 (approval-only submit):** One player with **no** work email but **in** SeasonPlayerApprovals for season 16. Options: (a) add `ApprovalOnlySubmitSteamId` to e2e-test-data with `work_email: null`, `work_email_verified: 0`, and add a row to SeasonPlayerApprovals (season_id=16, team_id=999, steam_id=ApprovalOnlySubmitSteamId); or (b) reuse and repurpose an existing ID and add that approval row. Cleanest: new ID + one approval row.
- **A1 (manual approval → signup):** `ManualApprovalTargetSteamId` must exist as an account/Steam player (via e2e-test-data + seed loop) but **must not** be in SeasonPlayerApprovals initially. Seed should **not** insert it into SeasonPlayerApprovals; the test will do that via the admin approval form.
- **A2 (manual rank → signup):** `ManualRankTargetSteamId` must exist as account/Steam player, and must **not** have a row in SeasonPlayerRanks for season 16 initially. Admin adds it via the rank form in the test.
- **A3/A4:** Rely on existing seed: team 999, season 16, registrations/drafts. For A4 (“manual validity”), ensure there is at least one team that is invalid by default (e.g. unverified email or missing approval) so the test can set “manual validity” and then assert it becomes valid.
- **A5:** Reuse existing org/team/players from seed, or add a dedicated “add-team signup” team/org in seed if you want a clean slate.

---

## 4. shared-msw: what to add for each new Steam ID

**Rule:** Every new Steam ID that appears in **e2e-test-data** and is used in signup or dashboard flows should be handled in shared-msw so backend/component tests (and future e2e using MSW) see consistent behavior.

**Files and changes:**

### 4.1 [packages/types/src/test/fixtures.ts](packages/types/src/test/fixtures.ts)

- Add one export per new ID, e.g.:
- `DraftReturnUserSteamId = "66561198999999925"`
- `ApprovalOnlySubmitSteamId = "66561198999999926"`
- `ManualApprovalTargetSteamId = "66561198999999927"`
- `ManualRankTargetSteamId = "66561198999999928"`

### 4.2 [packages/types/src/test/e2e-test-data.ts](packages/types/src/test/e2e-test-data.ts)

- Import the new constants.
- Append one entry per ID to `e2eSteamPlayerData` with `account_id`, `steam_id`, `nickname`, and:
- **DraftReturnUserSteamId:** e.g. work_email verified, like ValidWorkEmail1.
- **ApprovalOnlySubmitSteamId:** `work_email: null`, `work_email_verified: 0` (or equivalent) so backend treats as “no work email”; approval will come from SeasonPlayerApprovals.
- **ManualApprovalTargetSteamId:** same as DraftReturn for profile; approval is added by the test.
- **ManualRankTargetSteamId:** same as DraftReturn for profile; rank is added by the test.

**Effect:** [GetPlayerSummaries-handlers.ts](packages/shared-msw/src/steam/GetPlayerSummaries-handlers.ts) uses `e2eSteamPlayerData` → new IDs get a profile automatically. [GetOwnedGames-handlers.ts](packages/shared-msw/src/steam/GetOwnedGames-handlers.ts) uses `e2eSteamPlayerData` and special cases for “no hours” → new IDs get default “has CS2 hours” unless we add a special case (e.g. for ManualRankTarget we might want “has hours” so the only blocker is rank).

### 4.3 [packages/shared-msw/src/steam/GetOwnedGames-handlers.ts](packages/shared-msw/src/steam/GetOwnedGames-handlers.ts)

- For **ManualRankTargetSteamId** (and any other new ID that must “have hours”): no change if they’re in `e2eSteamPlayerData` (they already get default 90h). If we need “no hours” for some ID, add a branch like for `InsufficientHoursPlayerSteamId` that returns `games: []`.

### 4.4 [packages/shared-msw/src/faceit/GameRank-handlers.ts](packages/shared-msw/src/faceit/GameRank-handlers.ts)

- Import the new Steam ID constants from `@eggosystem/types`.
- Add one `if (gamePlayerId === DraftReturnUserSteamId)` (and same for the others) returning `createFaceitRank(gamePlayerId, "cs2", 1500, 10)` (or the level/elo you want).  
  This makes FACEIT “rank” resolvable for that ID in backend/component tests and keeps behavior aligned with e2e when e2e eventually uses MSW or the same IDs.

### 4.5 [packages/shared-msw/src/faceit/Metadata-handlers.ts](packages/shared-msw/src/faceit/Metadata-handlers.ts)

- If signup or dashboard flows call FACEIT metadata for these IDs, add branches for `faceit_player_id === DraftReturnUserSteamId` (etc.) and return the same shape as for other valid e2e IDs (e.g. same pattern as heppajpg/ValidWorkEmail1).  
  If the code path never hits metadata for these IDs, this can be done later when needed.

### 4.6 Re-export from types

- Ensure [packages/types](packages/types) exports the new constants (e.g. from `src/test/fixtures.ts` or your main test exports) so shared-msw and e2e specs can import them.

---

## 5. E2E seed changes (per workflow)

**File:** [apps/backend/seeds/e2e_test_seed.ts](apps/backend/seeds/e2e_test_seed.ts).

- **S2:** If you added `DraftReturnUserSteamId` to `e2eSteamPlayerData`, the existing `for (const player of steamPlayerData)` loop already creates Account, SteamPlayer, LinkedAccount. No extra seed logic.
- **S3:**
- Add `ApprovalOnlySubmitSteamId` to `e2eSteamPlayerData` with no work email.
- In the seed, insert into **SeasonPlayerApprovals** for (season_id=16, team_id=999, steam_id=ApprovalOnlySubmitSteamId) (reuse the same pattern as for QuattraSteamId).
- Ensure that account’s `work_email` / `work_email_verified` in Accounts match “no work email” (seed loop or a small dedicated update).
- **A1:**
- Add `ManualApprovalTargetSteamId` to e2e-test-data and seed loop.
- Do **not** add it to SeasonPlayerApprovals; the test will do that via the admin form.
- **A2:**
- Add `ManualRankTargetSteamId` to e2e-test-data and seed loop.
- Do **not** add a row in SeasonPlayerRanks for (steam_id, season_id=16); the test will add it via the admin rank form.
- **A3/A4:** Use current team 999 / season 16 registrations and drafts. If A4 needs a “invalid until manual validity” team, add a second org/team and a registration that is invalid by default (e.g. unverified player or no approval).
- **A5:** Reuse existing org/team/players; or add a small “add-team signup” org/team in seed and use that in the test.

---

## 6. E2E Playwright mocks (page.route) for new IDs

E2E still uses **Playwright** `page.route()`, not MSW. For each new Steam ID used in the browser:

- **Steam:** If the frontend (or a backend-proxy call from the frontend) hits Steam, add `page.route("**/api.steampowered.com/...", ...)` (or your actual URL pattern) and in the handler, when the request contains the new Steam ID, return a body that matches what shared-msw returns for that ID (same profile shape, same hours/default game). Reuse the structure from [AddPlayer.spec.ts](apps/frontend/src/e2e/AddPlayer.spec.ts) (GetPlayerSummaries / GetOwnedGames).
- **FACEIT:** If the frontend or proxy hits FACEIT, add `page.route("**/api.faceit.com/...", ...)` and for the new `game_player_id` return the same elo/level you chose in GameRank-handlers (e.g. 1500, 10).

That keeps “unique Steam IDs for major tests” and “MSW mock correctly in shared-msw” aligned: same IDs, same contract; only the transport (MSW vs Playwright) differs.

---

## 7. Step-by-step implementation order

Do these in order so types, seed, and MSW stay consistent and no test runs before its data exists.

1. **Types and data**

- Add the four new Steam ID constants to [packages/types/src/test/fixtures.ts](packages/types/src/test/fixtures.ts).
- Add the four entries to `e2eSteamPlayerData` in [packages/types/src/test/e2e-test-data.ts](packages/types/src/test/e2e-test-data.ts) with the right `work_email`/`work_email_verified` and other fields.
- Export the new constants from the types package where other packages and e2e import from.

2. **shared-msw**

- In [packages/shared-msw/src/steam/GetPlayerSummaries-handlers.ts](packages/shared-msw/src/steam/GetPlayerSummaries-handlers.ts): no change if handlers already key off `e2eSteamPlayerData` (new IDs are picked up automatically).
- In [packages/shared-msw/src/steam/GetOwnedGames-handlers.ts](packages/shared-msw/src/steam/GetOwnedGames-handlers.ts): add special cases only if an ID must have “no hours” or different hours.
- In [packages/shared-msw/src/faceit/GameRank-handlers.ts](packages/shared-msw/src/faceit/GameRank-handlers.ts): add `if (gamePlayerId === X)` branches for each new Steam ID and return a valid FACEIT rank.
- In [packages/shared-msw/src/faceit/Metadata-handlers.ts](packages/shared-msw/src/faceit/Metadata-handlers.ts): add branches for new IDs if the signup/dashboard code path calls FACEIT metadata for them.

3. **E2E seed**

- In [apps/backend/seeds/e2e_test_seed.ts](apps/backend/seeds/e2e_test_seed.ts): no code change is needed for Account/SteamPlayer/LinkedAccount creation—once the 4 new IDs are in `e2eSteamPlayerData` in packages/types, the seed’s existing `for (const player of steamPlayerData)` loop (where `steamPlayerData = e2eSteamPlayerData`) already creates them.
- Add SeasonPlayerApprovals row for **ApprovalOnlySubmitSteamId** (S3) for season 16, team 999.
- Do **not** add SeasonPlayerApprovals for **ManualApprovalTargetSteamId** (A1) or SeasonPlayerRanks for **ManualRankTargetSteamId** (A2).
- For A4, add a second team/registration that is “invalid until manual validity” if you want a dedicated test.

4. **E2E specs (extend vs new)**

- **S3 (extend):** In [SignupForm.spec.ts](apps/frontend/src/e2e/SignupForm.spec.ts), add a test that fills the lineup with five players including **ApprovalOnlySubmitSteamId**, assigns captain/co-captain, accepts terms, submits, and asserts success. Use existing FACEIT/Steam route mocks; ensure the request pattern includes the new ID if the app calls Steam/FACEIT for it.
- **S2 (new):** In SignupForm.spec, add a test that saves a draft (org/team/players), then in the same or a new context re-opens registration and asserts form is prefilled from draft, then submits or saves again. Use **DraftReturnUserSteamId** as the logged-in user (or heppajpg if you skip a dedicated ID) and ensure draft is keyed by that user.
- **A1 (new):** New spec or describe “Admin registration”. Step 1: as admin (use `generateTestJWTForUser` with heppajpg/admin, or the project’s admin E2E pattern from [playwright-mcp-admin-auth.mdc](.cursor/rules/development/playwright-mcp-admin-auth.mdc)), open `/dashboard/registration/approval`, add approval for org/team and **ManualApprovalTargetSteamId**, submit. Step 2: as a user whose lineup includes **ManualApprovalTargetSteamId**, complete signup and assert submit succeeds. Use Playwright route mocks for Steam/FACEIT for that ID (same shape as shared-msw).
- **A2 (new):** Same spec/describe. Step 1: as admin (same auth pattern as A1), open `/dashboard/registration/rank`, enter **ManualRankTargetSteamId**, season 16, and required rank/hours, submit. Step 2: as user, add that ID in registration, complete form, submit, assert success. Mocks as in A1.
- **A3/A4 (new):** In the same “Admin registration” spec, add tests that open `/dashboard/registration/registered`, select season, assert teams/drafts load, then bulk-approve (A3) and set manual validity (A4), and assert UI/state. Use existing seed teams/registrations.
- **A5 (new):** Add test that opens `/dashboard/registration/add-team`, selects season, fills SignupForm (org/team/5 players/captains) with existing or new IDs, submits, and asserts POST to admin signup and success. Reuse ValidWorkEmail/heppajpg or the new AddTeamSignupSteamId1–5 if you added them.

5. **Validation**

- Run backend tests that use MSW and touch signup/dashboard flows to ensure new IDs don’t break existing tests and new handlers behave as intended.
- Run e2e with `pnpm test:e2e` (and backend on `dev:e2e`) and confirm S2, S3, A1, A2, A3, A4, A5 pass.
- Optionally run a single e2e test per new ID to confirm isolation (e.g. run only the S3 test, then only the A1 test).

---

## 8. One-page checklist

- [ ] Types: 4 new Steam ID constants in fixtures + 4 entries in e2eSteamPlayerData.
- [ ] shared-msw: GetPlayerSummaries/GetOwnedGames cover new IDs (by e2eSteamPlayerData or explicit branch).
- [ ] shared-msw: GameRank-handlers (and Metadata if needed) have branches for the 4 new IDs.
- [ ] E2E seed: New accounts/SteamPlayers/LinkedAccounts via e2eSteamPlayerData; SeasonPlayerApprovals only for ApprovalOnlySubmitSteamId; no approval for ManualApprovalTargetSteamId; no rank for ManualRankTargetSteamId.
- [ ] E2E S2: Draft-return test using DraftReturnUserSteamId (or heppajpg) and draft prefilled.
- [ ] E2E S3: Approval-only submit test using ApprovalOnlySubmitSteamId.
- [ ] E2E A1: Admin approval then user signup with ManualApprovalTargetSteamId.
- [ ] E2E A2: Admin manual rank then user signup with ManualRankTargetSteamId.
- [ ] E2E A3/A4: Registered teams + bulk approve + manual validity tests on existing seed data.
- [ ] E2E A5: Add-team signup test.
- [ ] Playwright route mocks for new IDs match shared-msw contract (Steam profile/hours, FACEIT rank).
- [ ] Backend tests and full e2e run pass.

This gives a repeatable, correct execution path: unique Steam IDs per major test, e2e seeds that match those IDs, and shared-msw kept in sync so “new users” are mocked consistently everywhere.
