# Portal Implementation Plan — KanaRating 3.2 Event Data

**Source:** `docs/parser-updates.md` (KanaRating 3.2 — Event Export & Stats Portal Plan)  
**Status:** Planning  
**Scope:** Backend ingestion, API, and frontend — our side of the 3.2 integration

---

## Overview

The parser team is exporting six new event logs alongside the existing parser JSON output. Our job is to:

1. Ingest and store the new event data into the database
2. Expose API endpoints that query that data
3. Build frontend UI features on top of those APIs

We split work into **phases** so each phase ships as one or a small number of focused PRs. Foundation (DB + ingestion) comes first. API and UI phases follow independently once data is flowing.

---

## New parser output we need to consume

| Parser key            | New data                                                                                                                                                                  | Our table                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `Meta` block          | `parser_version`, `match_game_id`, `map`, `parsed_at`                                                                                                                     | `MatchGames` enrichment (already has most) |
| `KillLog` enrichment  | `is_first_death`, `is_exit_kill`, `is_post_plant`, `was_victim_traded`, `setup_flash_thrower`, `setup_damage_player`, `victim_blind_seconds`, `ct_buy_type`, `t_buy_type` | `PlayerKillLogs` new columns               |
| `RoundSwingLog`       | Per-kill win-probability deltas                                                                                                                                           | `RoundSwingEvents` (new table)             |
| `FlashLog`            | Per-flash events with thrower/victim/duration                                                                                                                             | `FlashEvents` (new table)                  |
| `SetupEventLog`       | Flash→kill and util-damage→kill chains                                                                                                                                    | `SetupEvents` (new table)                  |
| `WastedUtilityLog`    | Wasted grenade events per round                                                                                                                                           | `WastedUtilityEvents` (new table)          |
| `RoundUtilitySummary` | Per-round per-player utility rollup                                                                                                                                       | `RoundUtilitySummary` (new table)          |

The parser populates all new arrays as `[]` by default, so ingestion must handle empty arrays gracefully. All new fields are additive — old parser JSON without them must still ingest without errors.

---

## Phase 1 — DB Schema (foundation)

**Goal:** Get the database schema ready before any application logic changes. Pure migrations, no behaviour change.

### PR 1-A: Enrich `PlayerKillLogs` with new columns

**Migration:**

Add new nullable columns to the existing `PlayerKillLogs` table:

```
is_first_death        BOOLEAN  (nullable — null means old parser data)
is_exit_kill          BOOLEAN  (nullable)
is_post_plant         BOOLEAN  (nullable)
was_victim_traded     BOOLEAN  (nullable)
setup_flash_thrower   BIGINT   (nullable, 0 = no setup in parser, null = old data)
setup_damage_player   BIGINT   (nullable)
victim_blind_seconds  DECIMAL(6,3)  (nullable)
ct_buy_type           VARCHAR  (nullable, denormalized from MapRoundStats)
t_buy_type            VARCHAR  (nullable)
```

All new columns are nullable. Old parsed rows keep `NULL`; new parser JSON rows get real values.

**Tests:** None needed — migration-only PR.

---

### PR 1-B: New event tables

**Migration:** Create five new tables.

#### `FlashEvents`

```
id                  BIGINT UNSIGNED AUTO_INCREMENT PK
match_game_id       INT UNSIGNED  FK → MatchGames.id
round_number        SMALLINT UNSIGNED
time_in_round       DECIMAL(7,3)
thrower_steam_id    BIGINT UNSIGNED   INDEX
victim_steam_id     BIGINT UNSIGNED   INDEX
duration_seconds    DECIMAL(6,3)
is_enemy_flash      BOOLEAN
is_teammate_flash   BOOLEAN
is_self_flash       BOOLEAN
thrower_team        VARCHAR(2)   -- 'CT' | 'T'
victim_team         VARCHAR(2)
```

Composite index: `(match_game_id, round_number)`, `(thrower_steam_id, victim_steam_id)`.

#### `RoundSwingEvents`

```
id                       BIGINT UNSIGNED AUTO_INCREMENT PK
match_game_id            INT UNSIGNED  FK → MatchGames.id
round_number             SMALLINT UNSIGNED
time_in_round            DECIMAL(7,3)
event_type               VARCHAR(32)   -- 'kill', future 'plant'/'defuse'
pre_win_prob             DECIMAL(5,4)
post_win_prob            DECIMAL(5,4)
delta                    DECIMAL(5,4)
primary_player_steam_id  BIGINT UNSIGNED  INDEX
contributors             JSON          -- array of {steam_id, contribution}
```

Index: `(match_game_id, round_number)`.

> **Decision:** store contributors as JSON column for now (avoids a join for the main use case of "top swings in a round"). Revisit if we need contributor-level analytics.

#### `SetupEvents`

```
id                       BIGINT UNSIGNED AUTO_INCREMENT PK
match_game_id            INT UNSIGNED  FK → MatchGames.id
round_number             SMALLINT UNSIGNED
time_in_round            DECIMAL(7,3)
setup_type               VARCHAR(32)   -- 'flash' | 'utility_damage'
setup_player_steam_id    BIGINT UNSIGNED  INDEX
beneficiary_steam_id     BIGINT UNSIGNED  INDEX
victim_steam_id          BIGINT UNSIGNED
seconds_after_setup      DECIMAL(6,3)
flash_duration           DECIMAL(6,3)  NULLABLE
damage_dealt             SMALLINT      NULLABLE
```

Index: `(match_game_id)`, `(setup_player_steam_id, beneficiary_steam_id)`.

#### `WastedUtilityEvents`

```
id                  BIGINT UNSIGNED AUTO_INCREMENT PK
match_game_id       INT UNSIGNED  FK → MatchGames.id
round_number        SMALLINT UNSIGNED
time_in_round       DECIMAL(7,3)
thrower_steam_id    BIGINT UNSIGNED  INDEX
utility_type        VARCHAR(16)   -- 'HE' | 'Molotov' | 'Incendiary'
```

Index: `(match_game_id, round_number)`.

#### `RoundUtilitySummary`

```
match_game_id        INT UNSIGNED  FK → MatchGames.id
round_number         SMALLINT UNSIGNED
steam_id             BIGINT UNSIGNED
flashes_thrown       SMALLINT UNSIGNED
enemies_flashed      SMALLINT UNSIGNED
teammates_flashed    SMALLINT UNSIGNED
smokes_thrown        SMALLINT UNSIGNED
utility_damage       SMALLINT UNSIGNED
wasted_utility       SMALLINT UNSIGNED

PK: (match_game_id, round_number, steam_id)
```

**Tests:** None needed — migration-only PR.

---

## Phase 2 — TypeScript Types & Ingest: KillLog Enrichment

**Goal:** Update TypeScript types for the new parser output shape and wire the enriched `KillLog` fields into `PlayerKillLogs`. This is the quickest ingest win (fields are additive on an existing table).

### PR 2: KillLog type extension + ingestion + tests

**Files touched:**

- `src/types/parse-queue.types.ts` — extend `KillEvent` with new optional fields; add optional `Meta` interface to `ParsedPayload`
- `apps/backend/migrations/` — already done in Phase 1 (new columns are already in DB)
- `src/models/player-kill-logs.models.ts` — map new fields when saving; treat `null`/absent fields gracefully
- `src/__mocks__/demo-parsed-json/mock-parsed-demo.ts` — add sample enriched kill fields to mock data

**Type changes (`parse-queue.types.ts`):**

```typescript
interface ParsedPayloadMeta {
  parser_version?: string;
  match_game_id?: string;
  map?: string;
  total_rounds?: number;
  parsed_at?: string;
}

interface KillEvent {
  // ... existing fields ...
  is_first_death?: boolean;
  is_exit_kill?: boolean;
  is_post_plant?: boolean;
  was_victim_traded?: boolean;
  ct_buy_type?: string;
  t_buy_type?: string;
  setup_flash_thrower?: number; // 0 means no setup (from parser)
  setup_damage_player?: number;
  victim_blind_seconds?: number;
}

interface ParsedPayload {
  // ... existing ...
  Meta?: ParsedPayloadMeta;
  FlashLog?: FlashEvent[];
  RoundSwingLog?: RoundSwingEvent[];
  SetupEventLog?: SetupEvent[];
  WastedUtilityLog?: WastedUtilityEvent[];
  RoundUtilitySummary?: RoundUtilitySummaryEntry[];
}
```

**Ingest changes (`player-kill-logs.models.ts`):**

When mapping `KillEvent` → DB row, include new fields. Use `?? null` for optional fields so old parser JSON (missing these fields) stores `NULL` rather than `undefined` blowing up the insert.

**Idempotency:** The existing reparse flow deletes `PlayerKillLogs` by `match_game_id` before re-inserting — this already covers the new columns.

**Tests:**

- Unit tests for the kill log mapping function
  - New fields present → values stored correctly
  - Fields absent (old parser output) → `NULL` stored, no crash
  - `setup_flash_thrower = 0` (parser means "no setup") → stored as `NULL` or `0` (decide in implementation, document)
- Update mock JSON to include sample enriched kill row

---

## Phase 3 — Ingest: RoundSwingEvents + FlashEvents

**Goal:** Ingest the two highest-value new event logs. Parser team ships RoundSwingLog first (very low effort on their side), so we want to be ready.

### PR 3: RoundSwingEvents + FlashEvents ingestion + tests

**Files touched:**

- `src/types/parse-queue.types.ts` — add `RoundSwingEvent`, `SwingContributor`, `FlashEvent` interfaces (scaffolded in Phase 2 as stubs, filled here)
- `src/models/round-swing-events.models.ts` — new model file: `saveRoundSwingEvents(matchGameId, events)`
- `src/models/flash-events.models.ts` — new model file: `saveFlashEvents(matchGameId, events)`
- `src/models/match-game.models.ts` → `saveParsedDemoDataForGame` — call new save functions when arrays are present and non-empty

**Ingest logic:**

Both use the same pattern as `PlayerKillLogs`:

1. Delete existing rows for `match_game_id` (idempotent reparse)
2. Bulk insert from the parser array
3. Skip gracefully if the array key is absent or empty

**Tests:**

- `round-swing-events.models.test.ts`
  - Bulk insert stores all fields correctly
  - Empty array → no rows inserted, no error
  - Reparse deletes previous rows before reinserting
- `flash-events.models.test.ts`
  - Bulk insert stores all fields correctly
  - `is_enemy_flash`, `is_teammate_flash`, `is_self_flash` stored correctly
  - Empty array → no rows
  - Reparse idempotency

---

## Phase 4 — Ingest: SetupEvents, WastedUtilityEvents, RoundUtilitySummary

**Goal:** Complete the ingestion side. After this phase, all new parser data lands in the database.

### PR 4: Remaining event table ingestion + tests

**Files touched:**

- `src/models/setup-events.models.ts` — `saveSetupEvents(matchGameId, events)`
- `src/models/wasted-utility-events.models.ts` — `saveWastedUtilityEvents(matchGameId, events)`
- `src/models/round-utility-summary.models.ts` — `saveRoundUtilitySummary(matchGameId, entries)`
- `src/models/match-game.models.ts` → `saveParsedDemoDataForGame` — wire remaining three
- `src/__mocks__/demo-parsed-json/mock-parsed-demo.ts` — add sample data for all new log types

**Tests:**

- One test file per model, covering:
  - Happy path bulk insert
  - Empty array → no-op
  - Reparse idempotency (delete + reinsert)
  - `RoundUtilitySummary` upsert on PK conflict (if a round/player row already exists)

---

## Phase 5 — API: Round Swing Timeline

**Goal:** Expose round-swing data so the frontend can render a "what swung the round" timeline for IGL review.

### PR 5: Round swing timeline API endpoint + tests

**Endpoint:** `GET /api/v1/match-games/:matchGameId/round-swings`

**Query params:**

- `roundNumber` (optional) — filter to one round
- `limit` (optional, default 5) — top N swings by `|delta|`

**Response shape:**

```json
{
  "round_swings": [
    {
      "round_number": 14,
      "time_in_round": 42.18,
      "event_type": "kill",
      "pre_win_prob": 0.62,
      "post_win_prob": 0.31,
      "delta": -0.31,
      "primary_player_steam_id": "76561198437815468",
      "contributors": [...]
    }
  ]
}
```

**Files:**

- `src/models/match-game-analysis.models.ts` — add `getRoundSwingEvents(matchGameId, options)`
- `src/controllers/match-games.controllers.ts` — add `getRoundSwings` handler
- `src/routes/v1/match-game.routes.ts` — register route

**Tests:**

- Controller unit test: returns 200 with correct shape
- Controller unit test: returns empty array for games with no swing data (old parser)
- Model unit test: `roundNumber` filter works correctly
- Model unit test: ordering by `|delta|` DESC

---

## Phase 6 — API: Flash Matrix

**Goal:** Expose flash data for the team/player flash matrix view — who blinds whom, how long, across a season or a single match.

### PR 6: Flash matrix API endpoint + tests

**Endpoints:**

- `GET /api/v1/match-games/:matchGameId/flash-matrix`
  - Per-match flash matrix grouped by `(thrower_steam_id, victim_steam_id)`
- `GET /api/v1/players/:steamId/flash-stats` (or `/match-games/:matchGameId/flash-stats`)
  - Per-player flash stats: enemy flashes, teammate flashes, avg duration

**Response shape (flash-matrix):**

```json
{
  "flash_matrix": [
    {
      "thrower_steam_id": "76561198160889809",
      "victim_steam_id": "76561198367129350",
      "flash_count": 5,
      "avg_blind_seconds": 2.4,
      "total_blind_seconds": 12.0
    }
  ]
}
```

**Files:**

- `src/models/flash-events.models.ts` — add `getFlashMatrix(matchGameId)`, `getPlayerFlashStats(matchGameId, steamId)`
- `src/controllers/match-games.controllers.ts` — add `getFlashMatrix` handler
- `src/routes/v1/match-game.routes.ts` — register route

**Tests:**

- Flash matrix query groups correctly by thrower/victim pair
- Filters `is_enemy_flash = true` correctly
- Returns empty array for old-parser games (no flash events)

---

## Phase 7 — API: Enriched Kill Filters

**Goal:** Expose the new KillLog fields so the frontend can filter kills by context (entry, post-plant, eco, exit).

### PR 7: Kill filter API enhancements + tests

Extend the existing kill/entry-analysis endpoints rather than creating new ones.

**Changes to existing endpoints:**

- `GET /api/v1/match-games/:matchGameId/kill-matrix` — existing endpoint
  - Add query params: `excludeExitKills`, `postPlantOnly`, `excludeEcoKills`
- `GET /api/v1/match-games/:matchGameId/afterplant-analysis` — existing endpoint
  - Can now use `is_post_plant` directly from `PlayerKillLogs` without heuristics

**New endpoint:**

- `GET /api/v1/match-games/:matchGameId/entry-kills`
  - Returns first-death kills enriched with `setup_flash_thrower`, `victim_blind_seconds`
  - For "entry support" analysis

**Files:**

- `src/models/match-game-analysis.models.ts` — extend kill queries with new filter options
- `src/models/player-kill-logs.models.ts` — add `getEntryKills(matchGameId)`
- `src/controllers/match-games.controllers.ts` — extend handlers
- `src/routes/v1/match-game.routes.ts` — register new route

**Tests:**

- `is_exit_kill` filter excludes correct rows
- `is_post_plant` filter works
- `is_first_death` returns at most one entry per round
- Graceful degradation when columns are `NULL` (old parser data)

---

## Phase 8 — API: Setup/Support Events + Utility Discipline

**Goal:** Support player report (who sets up whom) and utility discipline view (wasted util coaching).

### PR 8: Setup events + utility discipline API + tests

**Endpoints:**

- `GET /api/v1/match-games/:matchGameId/setup-pairs`
  - Returns support↔fragger pairs: `(setup_player, beneficiary, count)` grouped by `setup_type`
- `GET /api/v1/match-games/:matchGameId/wasted-utility`
  - Returns wasted utility events grouped by `(thrower_steam_id, utility_type)`
- `GET /api/v1/match-games/:matchGameId/round-utility-summary`
  - Returns per-round per-player utility counts (for timeline chart)

**Files:**

- `src/models/setup-events.models.ts` — add `getSetupPairs(matchGameId)`
- `src/models/wasted-utility-events.models.ts` — add `getWastedUtilityByPlayer(matchGameId)`
- `src/models/round-utility-summary.models.ts` — add `getRoundUtilitySummary(matchGameId)`
- `src/controllers/match-games.controllers.ts` — add handlers
- `src/routes/v1/match-game.routes.ts` — register routes

**Tests:**

- Setup pair aggregation groups correctly
- Wasted utility per player counts correctly
- Round utility summary returns correct round×player matrix
- All endpoints return empty/zero data gracefully for old-parser games

---

## Phase 9 — API: Player-level Flash & Utility Stats

**Goal:** Cross-game aggregation endpoints that power the player detail page's utility section and any per-player coaching views. The match-game-scoped endpoints (Phases 5–8) are not enough here — the player page needs stats rolled up across many games within a tournament or season.

### PR 9: Player flash stats + utility stats API + tests

**Endpoints:**

- `GET /api/v1/players/:steamId/flash-stats?tournamentId=...`
  - Aggregates `FlashEvents` across all `MatchGames` in the tournament/season
  - Returns: `avg_enemy_flashes_per_game`, `avg_blind_time_per_game`, `discipline_ratio` (enemy% of all flashes), `total_enemy_blind_time`, `teammate_flash_rate`, top victim steam ID
- `GET /api/v1/players/:steamId/utility-stats?tournamentId=...`
  - Aggregates `WastedUtilityEvents` and `RoundUtilitySummary`
  - Returns: `avg_wasted_per_game` by utility type, `avg_utility_damage_per_round`, `avg_flashes_thrown_per_round`, `avg_smokes_per_round`
- `GET /api/v1/players/:steamId/round-impact?tournamentId=...`
  - Aggregates `RoundSwingEvents` contribution weights
  - Returns: `total_impact_score` (sum of `|delta| × contribution`), `avg_impact_per_event`, `biggest_single_swing`, games played

**Response shape (flash-stats):**

```json
{
  "steam_id": "76561198160889809",
  "games_played": 12,
  "avg_enemy_flashes_per_game": 8.4,
  "avg_enemy_blind_time_per_game": 21.3,
  "discipline_ratio": 0.71,
  "teammate_flash_rate": 0.18,
  "total_enemy_blind_time": 255.2,
  "top_victim_steam_id": "76561198367129350"
}
```

**Files:**

- `src/models/flash-events.models.ts` — add `getPlayerFlashStatsCrossGame(steamId, options)`
- `src/models/round-utility-summary.models.ts` — add `getPlayerUtilityStatsCrossGame(steamId, options)`
- `src/models/round-swing-events.models.ts` — add `getPlayerRoundImpact(steamId, options)`
- `src/controllers/players.controllers.ts` — add handlers (or extend existing player controllers)
- `src/routes/v1/player.routes.ts` — register routes

**Tests:**

- Aggregation spans multiple games correctly
- `tournamentId` filter restricts to correct games
- Returns zeroed stats gracefully when player has no flash data (old demos)

---

## Phase 10 — API: Leaderboard Rankings

**Goal:** Tournament-wide leaderboard endpoints for the new flash and round swing data. These rank all players within a tournament by metrics that weren't possible before — blind time created, flash discipline, round impact.

### PR 10: Leaderboard APIs + tests

**Endpoints:**

- `GET /api/v1/tournaments/:tournamentId/leaderboards/flash`
  - Ranks all players by `total_enemy_blind_time` (default), or `enemy_flash_count`, or `discipline_ratio`
  - Query param: `sortBy=blind_time|flash_count|discipline`
  - Query param: `minGames=3` (filter out players with too few games)
- `GET /api/v1/tournaments/:tournamentId/leaderboards/round-impact`
  - Ranks all players by total weighted round impact score across tournament
  - Shows how many games played, total events attributed to player
- `GET /api/v1/tournaments/:tournamentId/leaderboards/utility-discipline`
  - Ranks by fewest wasted utilities per game (ascending) or most utility damage per round

**Response shape (flash leaderboard):**

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "steam_id": "76561198160889809",
      "games_played": 14,
      "total_enemy_blind_time": 312.4,
      "avg_enemy_blind_time_per_game": 22.3,
      "enemy_flash_count": 142,
      "discipline_ratio": 0.74,
      "teammate_flash_rate": 0.14
    }
  ]
}
```

**Files:**

- `src/models/leaderboard.models.ts` — new file: `getFlashLeaderboard(tournamentId, options)`, `getRoundImpactLeaderboard(tournamentId, options)`, `getUtilityDisciplineLeaderboard(tournamentId, options)`
- `src/controllers/tournaments.controllers.ts` — add leaderboard handlers (or separate leaderboard controller)
- `src/routes/v1/tournament.routes.ts` — register leaderboard routes

**Tests:**

- Rankings sort correctly by each metric
- `minGames` filter excludes low-sample players
- Ties handled (consistent ordering)
- Returns empty array for tournaments with no flash event data

---

## Phase 11 — Frontend: Round Swing Timeline

**Goal:** IGL review feature — a timeline showing the top win-probability swings per round.

### PR 9: Round swing timeline component + page integration

**Where it lives:** Match game detail page, "Round Review" tab (new or existing tab).

**UI sketch:**

- Select a round (already present in the round review UI)
- Show top 3–5 swings sorted by `|delta|`
- Each row: timestamp, event type icon, player name, delta shown as a bar or signed number
- Color: green delta = CT swing, red delta = T swing

**Files:**

- `apps/frontend/src/components/match-game/round-swing-timeline.tsx` — new component
- `apps/frontend/src/app/.../match-game/[matchGameId]/round-review/page.tsx` — integrate component (or wherever round review lives)
- API client hook: `useRoundSwings(matchGameId, roundNumber)`

**Tests (Playwright or component):**

- Renders correctly when data is present
- Shows empty state when no swing data (old demo)
- Round selector updates timeline

---

## Phase 12 — Frontend: Flash Matrix

**Goal:** Visual flash matrix showing who blinds whom — at team level for a match, and filterable by player.

### PR 10: Flash matrix component + page integration

**Where it lives:** Match game detail page, new "Flash Analysis" tab or section.

**UI sketch:**

- Heatmap grid: rows = throwers, columns = victims, cell = flash count + avg duration on hover
- Filter: enemy flashes only (default) / all
- Summary row: "Player X flashed enemies N times, avg Xs"

**Files:**

- `apps/frontend/src/components/match-game/flash-matrix.tsx` — new component
- `apps/frontend/src/app/.../match-game/[matchGameId]/flash-analysis/page.tsx` or tab integration
- API client hook: `useFlashMatrix(matchGameId)`

**Tests:**

- Matrix renders correct cells
- Empty state when no flash events

---

## Phase 13 — Frontend: Kill Filter Enhancements

**Goal:** Enrich the existing entry and kill views with context from the new KillLog fields.

### PR 11: Kill filter UI enhancements

**Changes:**

- Add filter toggles on the existing kill matrix / kill log view:
  - "Exclude exit kills" toggle (uses `is_exit_kill`)
  - "Post-plant only" toggle (uses `is_post_plant`)
  - "Eco round kills" toggle (uses `ct_buy_type` / `t_buy_type`)
- On entry kill rows: show flash assist icon if `setup_flash_thrower` is set
- On post-plant analysis tab: use the direct `is_post_plant` flag instead of heuristics

**Files:**

- Existing kill/entry components (identify exact paths during implementation)
- API client params extended for new filter options

---

## Phase 14 — Frontend: Support Player Report + Utility Discipline

**Goal:** Two new coaching/review features driven by SetupEvents and WastedUtilityEvents.

### PR 12: Support report + utility discipline UI

**Support player report:**

- Table: player × player setup-assist count, split by `flash` vs `utility_damage`
- Highlight top support fragger pair ("A set up B for N kills")

**Utility discipline view:**

- Per-round utility usage chart (from `RoundUtilitySummary`)
- Wasted utility breakdown per player: "Player X wasted 3 HEs in round 14"
- Highlight rounds with 0 smokes thrown on buy rounds

**Files:**

- `apps/frontend/src/components/match-game/support-pairs.tsx`
- `apps/frontend/src/components/match-game/utility-discipline.tsx`
- Integration into match game detail page

---

## Implementation Order Summary

| Phase | PR                                       | Content | Depends on |
| ----- | ---------------------------------------- | ------- | ---------- |
| 1A    | DB: KillLogs enrichment columns          | —       |
| 1B    | DB: New event tables                     | 1A      |
| 2     | Types + KillLog ingest                   | 1A, 1B  |
| 3     | RoundSwing + Flash ingest                | 1B, 2   |
| 4     | Setup + WastedUtil + RoundUtility ingest | 1B, 3   |
| 5     | API: Round swing timeline (per-match)    | 3       |
| 6     | API: Flash matrix (per-match)            | 3       |
| 7     | API: Kill filters (per-match)            | 2       |
| 8     | API: Setup + utility (per-match)         | 4       |
| 9     | API: Player-level flash & utility stats  | 3, 4    |
| 10    | API: Leaderboard rankings                | 9       |
| 11    | Frontend: Round swing UI                 | 5       |
| 12    | Frontend: Flash matrix UI                | 6       |
| 13    | Frontend: Kill filter UI                 | 7       |
| 14    | Frontend: Support + utility UI           | 8       |

Phases 1–4 are backend-only and can ship before the parser team deploys 3.2. Once 3.2 parser lands, the data starts flowing and API + frontend phases can go out incrementally. Phases 9–10 add cross-game aggregation on top of the per-match APIs, enabling the player detail page and leaderboards.

---

## Testing Strategy

### Backend (Phases 2–8)

Each ingest/model PR ships with unit tests in `__tests__/` or co-located `.test.ts` files:

- **Happy path:** parser JSON with all new fields → correct DB rows
- **Graceful degradation:** absent/null fields (old parser JSON) → `NULL` stored, no error
- **Idempotency:** reparse scenario — existing rows deleted, new rows inserted cleanly
- **Empty arrays:** all new log arrays empty → no rows inserted, no crash
- **Edge cases per feature:** see individual phase sections above

Use the existing `mock-parsed-demo.ts` fixture — update it incrementally as each phase adds new fields.

### Frontend (Phases 9–12)

- Component-level: render with mock data, render empty state
- Playwright E2E (where the page exists): at minimum a smoke test that the new tab/section renders

---

## Open Questions to Resolve Before Phase 2

1. **`setup_flash_thrower = 0`** — parser uses `0` to mean "no flash setup" (since `uint64`). Do we store `0` as-is or convert to `NULL` on ingest? Recommend: convert `0` → `NULL` in our mapper so DB semantics are clean.

2. **Reparse flow for new event tables** — the existing reparse for `PlayerKillLogs` uses a delete-by-`match_game_id` pattern. Confirm this pattern is safe for the new tables (no FK constraints blocking delete order). Add delete steps to `saveParsedDemoDataForGame` in the correct order.

3. **`contributors` storage for RoundSwingEvents** — plan says JSON column. Confirm MariaDB version supports JSON queries we'll need (MariaDB 10.5+ for full JSON path queries). If not, fall back to `VARCHAR` with JSON string.

4. **Old data** — most existing parsed matches won't have the new fields. All API endpoints must return empty/null gracefully. UI components must handle this state.

5. **Backfill** — the parser team notes that existing demos can be reparsed. We should confirm the reparse tooling (`scripts/reparse-demo.py`) is scoped and tested before kicking off a bulk backfill. This is a separate task after Phase 4.
