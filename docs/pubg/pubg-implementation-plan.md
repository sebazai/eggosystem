# PUBG Implementation Plan — Krafton API Integration

> **Scope**: Backend + database architecture and domain logic for adding PUBG: Battlegrounds
> as a new competitive platform under organizer **id 1 (Kanaliiga)**, ingesting match data
> and statistics via the **Krafton/PUBG API** (`api.pubg.com`). Frontend is out of scope
> here except where it constrains the API contract.
>
> **Where this sits in the build order (CS-refactor-first → PUBG-branch strategy):
> [`../execution-order.md`](../execution-order.md).**

---

## 1. Executive summary

**The system is already ~60% ready for PUBG at the competition/registration layer, but ~10% ready at the match/statistics layer.** The good news is the readiness gap is concentrated and well-bounded:

- The **game abstraction already exists and PUBG is already seeded**: `Games` row `id=2` (`PUBG: Battlegrounds`, `app_id=578080`), `GameTypes` rows `Duo (id=3)` and `Squad (id=4)`, and `OrganizerGames` already links **organizer 1 → game 2**. The season/league/team/registration stack is keyed on `game_id` and is genuinely game-agnostic.
- The **hard problem is the match + stats domain**. Every match/stats table in the system (`Matches`, `MatchGames`, `MatchTeams`, `TeamGameScores`, `PlayerStats`, plus the round/clutch/flash/util tables) is modelled around **CS2's two-team, round-based, CT/T-side format**. PUBG is a **battle-royale**: one lobby holds up to ~16–25 squads, and results are scored by **placement points + kill points accumulated across many matches**. These two models do not overlap; PUBG needs its own match domain.
- A secondary gap is **player identity**: `LinkedAccounts.provider` is `enum('steam','discord')` and the Krafton API keys players by `platform + playerName → accountId`. We need a PUBG identity mapping.
- An operational gap is **ingestion shape**: FaceIT is **webhook-push**; the Krafton API is **poll-only, rate-limited to ~10 req/min, and only retains matches ~14 days**. The ingestion pipeline must be a throttled poller, not a webhook handler.

**Recommendation**: build a **parallel PUBG match-and-stats domain** (new `Pubg*` tables) that **reuses the existing season / league / team / registration / identity / RBAC layer unchanged**. Do **not** overload the CS2 `Matches`/`PlayerStats` tables — doing so would force nullable-everything columns, weaken the CS2 trigger/constraint guarantees the project deliberately enforces in SQL, and entangle two unrelated scoring models.

### Readiness scorecard

| Capability area                         | Reusable as-is?                                   | Verdict                                           |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Game / game-type / organizer registry   | ✅ PUBG already seeded                            | **Ready**                                         |
| Seasons, Leagues, Stages, SeasonLeagues | ✅ keyed on `game_id`                             | **Ready** (`platform='krafton'` added 2026-06-05) |
| Teams, Organizations, rosters           | ✅ game-agnostic                                  | **Ready**                                         |
| Signup / registration (dual-roster)     | ✅ per-season `SeasonSignupSettings` (2026-06-05) | **Ready**                                         |
| Captain roles & RBAC triggers           | ✅ steam-id based                                 | **Ready**                                         |
| Player identity (Steam ↔ external)      | ⚠️ no PUBG account mapping                        | **Gap — new table**                               |
| Match container                         | ❌ 2-team / `best_of` shape                       | **Gap — new domain**                              |
| Per-game team scores                    | ❌ rounds + CT/T                                  | **Gap — new table**                               |
| Player statistics                       | ❌ ~100 CS2-only columns                          | **Gap — new table**                               |
| Standings / points engine               | ❌ win/loss-record based                          | **Gap — new logic**                               |
| External data ingestion                 | ⚠️ webhook-shaped, not poller                     | **Gap — new pipeline**                            |
| Sortter / kana_elo balancing            | ❌ CS demo / CSRankker bound                      | **Out of scope v1**                               |

---

## 2. What the system already gives us (the reusable layer)

These tables are game-agnostic and require **no structural change** (only data + one enum value):

| Table                                                             | Why it works for PUBG                                                                                    |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Games`                                                           | PUBG already present (`id=2`, `app_id=578080`).                                                          |
| `GameTypes`                                                       | `Duo` and `Squad` already present, with `min_players`/`max_players`.                                     |
| `OrganizerGames`                                                  | Organizer 1 ↔ PUBG link already present (`id=2`).                                                        |
| `Organizers`                                                      | Kanaliiga is `id=1`.                                                                                     |
| `Seasons`                                                         | Has `game_id`, `game_type_id`, `organizer_id` (default 1), `platform`, signup window, pricing, rulebook. |
| `Leagues`, `SeasonLeagues`, `SeasonLeagueTeams`                   | Division/tier structure is format-neutral.                                                               |
| `Stages`                                                          | Free-form named stages (group, playoffs, finals) — perfect for BR "Match Day / Grand Final".             |
| `Teams`, `Organizations`, `TeamRosters`                           | No CS2 assumptions.                                                                                      |
| `SeasonTeamRegistrations` (+ `external_platform_id`)              | Registration intent; can store a PUBG team tag.                                                          |
| `SeasonTeamRegistrationPlayers` → `SeasonTeamPlayers`             | Dual-roster (registration → competition) works identically.                                              |
| `SeasonPlayerApprovals`                                           | Employment verification is game-neutral.                                                                 |
| `Accounts`, `LinkedAccounts`, `SteamPlayers`                      | Steam auth still applies (PUBG is a Steam title).                                                        |
| `Roles`, `Permissions`, `AccountRoles`, `AccountPermissionScopes` | Captain/admin RBAC and its triggers are steam-id based and reusable.                                     |
| `Reservations`, `AccountCasterUrls`, `CasterApplications`         | Streaming/casting features carry over.                                                                   |

**Key consequence**: PUBG signup, team registration, captain management, divisions, and admin RBAC are essentially **free** — they flow through the same `season.services`, `season-team-registration.services`, and registration triggers, with `season.game_id = 2`.

### Two reuse caveats to handle in v1

1. **`SeasonActiveMapPool` / `Maps`** — `Maps` gets two new columns: `code_name` (Krafton's internal map identifier, e.g. `Desert_Main`) and `game_id` (FK to `Games`). All existing CS2 maps are backfilled to `game_id = 1`; PUBG maps are seeded with `game_id = 2`. `SeasonActiveMapPool` is **CS2-only** — it feeds the veto flow, which has no PUBG equivalent. For PUBG the map is determined by the Krafton custom lobby (outside our system) and arrives in the match payload at ingestion; it is resolved via `Maps.code_name` and stored directly on `PubgMatches.map_id`. The `game_id` column keeps the CS2 map-pool picker from showing PUBG maps (and scales to future games without heuristics).
2. **Sortter & `kana_elo`** — the balancing algorithm derives skill from CS2 demo parsing (`CSRankker`, `SteamPlayerKanaElo`, `SeasonPlayerRanks.kana_elo`). PUBG has no equivalent feed. **For v1, leagues/divisions are assigned manually** (or by prior-season placement); a PUBG ranking model is a later iteration. The registration tables don't require Sortter to function.

### `SeasonTeamPlayers` is reusable — and cross-game play is already allowed

`SeasonTeamPlayers` (the live competition roster) is reused for PUBG squads as-is. Its FKs are game-neutral (`season_id→Seasons`, `team_id→Teams`, `steam_id→SteamPlayers`) and `role`/`is_captain`/`is_co_captain`/`replaces_steam_id`/`ticket_number`/`discarded_at` all carry over.

**A player can be on a CS2 roster and a PUBG roster simultaneously — verified, no change needed.** The `before_insert_primary_check` / `before_update_primary_check` triggers (migration `20260326101000_fix_primary_triggers_discarded_at`) are **scoped to a single season**:

```sql
WHERE season_id = NEW.season_id   -- only conflicts WITHIN one season
  AND role = 'primary' AND steam_id = NEW.steam_id AND discarded_at IS NULL
```

A CS2 season and a PUBG season have different `season_id`s, so the primary-uniqueness check never fires across them. `steam_id` **is the PRIMARY KEY of `SteamPlayers` (globally unique)** — so cross-game play is safe not because a player can hold multiple `SteamPlayers` rows, but because the _per-season_ uniqueness that matters lives in `SeasonTeamPlayers` and is scoped by `season_id` (verified against the live schema, 2026-06-04). The global `captain` role flag in `AccountRoles` is harmless to hold for two games; scoped captain permissions live in `AccountPermissionScopes` keyed by season/team, so there is no cross-game leakage. Identity also stacks cleanly: one `SteamPlayers` row can carry both a CS2 `faceit_id` and a PUBG account via `PubgPlayerIdentities` (§6.2).

**One column caveat:** `SeasonTeamPlayers.match_id` is an FK to the CS2 **`Matches`** table (used for per-match _substitute_ lineups, joined against `MatchTeams` in `match.models.ts`). PUBG must leave `match_id = NULL` (base roster rows already do) and **must not** invoke the CS2 lineup/substitute-validation code paths. "Who actually played a PUBG lobby" is derived from `PubgMatchPlayerStats` (the Krafton participants), not from this column. If per-match PUBG substitutions ever need first-class tracking, add a nullable `pubg_match_id` rather than overloading `match_id`.

> Note: `Teams` has no `game_id`, so the schema does not force a team to be game-specific — the same `Teams` row _could_ register for both a CS2 and a PUBG season. Whether orgs field one shared team or distinct per-game squads is a registration/product choice, not a schema constraint.

---

## 3. The core architectural challenge: round-based vs battle-royale

The existing match model is a **three-level CS2 hierarchy**:

```
Matches (2 teams, best_of)            ← head-to-head
   └─ MatchGames (a map, demofile)    ← per-map
        ├─ TeamGameScores (CT/T, rounds, halftime)
        └─ PlayerStats (~100 cols: ADR, clutches, flashes, plants, trades, KAST…)
```

PUBG's competitive model is fundamentally different:

```
Tournament Stage (e.g. "Week 1")
   └─ PUBG Match  (= ONE lobby/game, ONE map, up to ~16–25 squads)
        ├─ Roster per team   → placement rank (1..N), placement points, won flag
        │       └─ kill points = team kills × kill_point_value
        └─ Participant per player → kills, assists, knocks (DBNOs), revives,
                                     damage, headshots, longest kill, survival
                                     time, walk/ride distance, heals, boosts, win place
Final standings = Σ (placement points + kill points) over all matches in the stage
```

Structural differences that make overloading the CS2 tables a mistake:

| Dimension         | CS2 (`Matches`)                                 | PUBG                                                |
| ----------------- | ----------------------------------------------- | --------------------------------------------------- |
| Teams per match   | exactly 2                                       | up to ~16–25                                        |
| Result type       | rounds won (16/13…), per side                   | rank (1..N) + kills                                 |
| Scoring           | who has more rounds                             | cumulative points across matches                    |
| Sides             | CT / T (in `TeamGameScores`)                    | none                                                |
| Per-player stats  | round/utility/clutch oriented                   | survival/positioning oriented                       |
| Match status flow | `VOTING`/`CONFIGURING` (veto)                   | no veto; lobby → started → finished                 |
| External grouping | `external_match_room_id` (one room = one match) | a Krafton `matchId` per lobby; many per "match day" |

`MatchTeams` PK `(match_id, team_id)` _could_ technically hold N teams, but `TeamGameScores` (CT/T + rounds), the `Matches.best_of` semantics, the CS-specific `status` enum, the composite veto tables, and the `before_insert_primary_check`-style triggers all assume the duel format. Reusing them would mean nulling out most columns and disabling the very SQL guarantees the architecture prizes. **Verdict: new domain.**

---

## 4. Krafton / PUBG API constraints (these drive the design)

> **Configuration status (2026-06):** the API key is now provisioned. `PUBG_API_KEY` is
> declared in `apps/backend/.env` + `.env.example`; its value is stored as a GitLab CI/CD
> variable and injected into the deployed backend through the `environment:` block of every
> deploy compose file (`docker-compose.{prod,stage,dev,ondemand}.yml`), which the `deploy-*`
> jobs in `.gitlab-ci.yml` render with `envsubst` — the same path `FACEIT_API_KEY` uses, so
> no `.gitlab-ci.yml` edit is required. Official API reference: **https://documentation.pubg.com/**.

The PUBG API (`https://api.pubg.com`, Bearer API key from `developer.pubg.com`; full reference
at [documentation.pubg.com](https://documentation.pubg.com/)) differs from FaceIT in ways that
materially shape ingestion:

1. **Poll-only, no webhooks.** Nothing pushes us match completion. We must discover and pull matches. → ingestion is a **scheduled/queued poller**, not a webhook controller like `faceit-webhook.controllers.ts`.
2. **Aggressive rate limit (~10 requests/minute** on a standard key; the `/matches` and telemetry CDN reads are exempt/cheaper). → mandatory **throttling + Redis caching + a BullMQ queue**, reusing the project's existing Redis/BullMQ infra.
3. **~14-day match retention.** PUBG purges match data after roughly two weeks. → matches must be **ingested promptly and persisted**; we cannot rely on back-filling later. A daily/hourly poll is required during active seasons.
4. **Custom-match discovery problem.** Esports games are _custom matches_. The `/players` lookup only returns a player's **last ~50 matches / 14 days**, and custom matches are flagged `isCustomMatch=true`. Match IDs are discovered by polling a **known roster player** (a registered participant) and filtering to custom matches — or via the `/tournaments` endpoints if a PUBG Esports tournament code is issued. We support **both auto-discovery and manual match-ID entry** by admins.
5. **Shards/platforms.** Players are namespaced by platform shard (`steam`, `kakao`, console, plus a special `tournament` shard). Kanaliiga is PC → `steam` shard primarily.
6. **Telemetry is large and offloaded.** Detailed event data lives in a separate telemetry JSON on a CDN URL referenced from the match `assets`. Mirroring the **Allstar pattern** (store metadata + URL, parse selectively), we store the telemetry URL and only parse it on demand for advanced stats.

### Relevant endpoints

| Need                                                    | Endpoint                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| Resolve player(s) by name → accountId + recent matchIds | `GET /shards/{shard}/players?filter[playerNames]=a,b,…` (≤10)     |
| Player by accountId                                     | `GET /shards/{shard}/players/{accountId}`                         |
| Match detail (rosters, participants, assets)            | `GET /shards/{shard}/matches/{matchId}` _(public, light limit)_   |
| Telemetry events                                        | CDN URL from match `assets`                                       |
| Tournament matches (if issued a code)                   | `GET /tournaments`, `GET /tournaments/{id}`                       |
| Seasons / lifetime ranked stats                         | `GET /shards/{shard}/seasons`, `/players/{id}/seasons/{seasonId}` |

Match payload shape we ingest (JSON:API): `data.attributes` (`mapName`, `gameMode`, `duration`, `createdAt`, `isCustomMatch`, `matchType`), `included[type=roster]` (`attributes.stats.rank`, `won`, relationships→participants), `included[type=participant]` (`attributes.stats.*` per player), `included[type=asset]` (telemetry URL).

### Validated against a real payload (`docs/pubg/pubg_matchdata-example.json`)

A real Kanaliiga custom match confirms the model and pins down details that change the schema:

- **Shape confirmed**: one match = **16 rosters × 4 participants = 64 players**, exactly the BR shape §3 assumed. `data.attributes`: `gameMode:"esports-squad-fpp"`, `matchType:"custom"`, `isCustomMatch:true`, `mapName:"Desert_Main"`, `duration:1774`, `createdAt`, `titleId:"bluehole-pubg"`.
- **Map names are internal code names, not display names** — `Desert_Main` = Miramar, `Baltic_Main` = Erangel, `Tiger_Main` = Taego, `DihorOtok_Main` = Vikendi, `Savage_Main` = Sanhok, `Neon_Main` = Rondo, `Kiki_Main` = Deston, etc. We must store/seed the **code** and map to a display name (see §6.1).
- **Roster `team` relationship is `null`** for custom matches (`relationships.team.data: null`), and `stats.teamId` is just an **in-lobby slot number (1..N), not stable across matches and not our team id**. → confirms there is **no shortcut**: a roster is matched to a Kanaliiga `Teams` row **only** by resolving its participants' `playerId` (`account.xxxx`) → `PubgPlayerIdentities` → `SeasonTeamPlayers`. This is the single most important domain rule (see §8).
- **`won` is a JSON string** (`"false"`/`"true"`), not a boolean — coerce in the transform.
- **Per-participant `stats` fields** (exact keys): `kills, assists, DBNOs, revives, headshotKills, damageDealt`(float)`, longestKill`(float)`, killStreaks, killPlace, winPlace, roadKills, teamKills, vehicleDestroys, timeSurvived, walkDistance, rideDistance, swimDistance, heals, boosts, weaponsAcquired, deathType`(`byplayer`/`byzone`/`alive`/`logout`)`, name, playerId`. Two fields not in the original draft — **`vehicleDestroys`** and **`killPlace`** — are added to the schema (§6.6). `winPlace` equals the roster `rank` (safe to denormalise).
- **No steam_id anywhere** — only `playerId` (`account.xxxx`) + mutable `name`. Reinforces the §6.2 identity table as mandatory.
- **Telemetry asset** = `included[type=asset]` with `attributes.name:"telemetry"` and a CDN `attributes.URL` (`telemetry-cdn.pubg.com/...-telemetry.json`). Store the URL, parse on demand (Allstar pattern).

---

## 5. Proposed architecture

**Strategy: shared competition spine + isolated PUBG match domain.**

```
                 ┌──────────────────── REUSED, UNCHANGED ───────────────────┐
 Steam login →   Accounts / LinkedAccounts / SteamPlayers                    │
                 Seasons(game_id=2, platform='krafton') / Leagues / Stages   │
                 Teams / SeasonLeagueTeams / registration (dual-roster) / RBAC│
                 └──────────────────────────┬───────────────────────────────┘
                                            │ (season_id, league_id, team_id, steam_id)
        ┌───────────────────────────────────┴───────────────────────────────┐
        │                       NEW PUBG MATCH DOMAIN                         │
        │  PubgPlayerIdentities  (steam_id ↔ pubg account/shard/name)         │
        │  PubgScoringRules      (placement points table + kill point value)  │
        │  PubgMatches           (one lobby: map, mode, krafton matchId)      │
        │  PubgMatchRosters      (team placement rank, points, won)           │
        │  PubgMatchPlayerStats  (per-player BR stats)                        │
        │  PubgMatchIngestion    (poll log / dedupe / retry — Faceit-webhook  │
        │                          analogue, but poll-based)                  │
        └─────────────────────────────────────────────────────────────────────┘
                  ▲ standings/points computed by aggregation (service or SQL view)
```

Ingestion mirrors the **FaceIT service layering** (`faceit-*.services.ts` fetch + Redis cache) but the **trigger** is a **BullMQ poller / cron job** (the project already has `cron-scheduler.services.ts`, BullMQ, and RabbitMQ), not an inbound webhook.

### 5.1 Decision: parallel storage, unified read — _not_ one physical match table

A deliberate fork was evaluated: **should PUBG matches live in the existing `Matches`/`MatchTeams` tables** (one match model for all games), or in a separate PUBG domain?

**Decision: keep PUBG match/stat _storage_ separate (`Pubg*` tables), and unify only at the _read_ layer via a `MatchEvents` view.** Rationale:

1. **`MatchTeams` has nowhere for a BR result.** Its only result column is `match_side varchar(16)`; a battle-royale result is `rank + placement_points + kill_points` per team. Hosting PUBG there means `ALTER`-ing the live CS2 table with nullable BR columns (pollution), and `TeamGameScores`/`PlayerStats` remain unusable for PUBG regardless — so new result tables are needed either way. Reuse would save ≈1 table at the cost of entangling two schemas.
2. **`Matches` carries CS2 assumptions** — `best_of NOT NULL`, `MatchGames.demofile NOT NULL UNIQUE` — that PUBG can only satisfy with sentinels or migrations on a production table.
3. **Pervasive 2-team coupling (the decisive factor).** The CS2 surface has **~287 query sites across 42 files** reading this cluster, and they hard-code head-to-head: `standings.services.ts` does `round.teams[1 - index]` ("the _other_ of two teams"); `match.models.ts` uses `match_side='home'/'away'` with dual self-joins (`mt1`/`mt2`) and `home_score`/`away_score`; `match-game.models.ts` resolves exactly `team1`/`team2` and throws otherwise. Injecting a 16-roster row into `Matches` would force every one of those paths to become game-aware or silently break.

The legitimate goal behind "all matches in one place" — a single cross-game **calendar / casting / listing** surface — is met at the **read layer** instead of the storage layer (see §6.9 `MatchEvents`). This isolates PUBG behind `game_id`, touches **zero** CS2 query sites, and leaves the door open to a future game-neutral container refactor (Option C) without committing to it now.

> Reflected below: the PUBG domain keeps its own `PubgMatches.id` (not a row in `Matches`), and a `MatchEvents` SQL view (§6.9) projects the common columns from both `Matches` and `PubgMatches` for cross-game reads.

---

## 6. Database schema deltas

All via Knex migrations under `apps/backend/migrations/`, with matching types + `createMockX` factories in `packages/types/src/db/`.

### 6.1 Enum + lookup data (small alters / seeds)

```sql
-- 1. New platform value (a new platform, NOT faceit)
-- ✅ DONE 2026-06-05: migration 20260605130000_add_krafton_platform_enum.ts + SeasonPlatform.Krafton in types
ALTER TABLE Seasons
  MODIFY platform ENUM('kanaliiga','esportal','faceit','popflash','krafton')
  NOT NULL DEFAULT 'kanaliiga';

-- 2. PUBG maps.
--    Add game_id (FK → Games) so the CS2 map-pool picker stays game-scoped and future games
--    can add their own maps without heuristics. Backfill existing CS2 maps to game_id = 1.
--    Add code_name for Krafton's internal map identifiers (NULL for CS2 maps).
--    SeasonActiveMapPool is NOT used for PUBG — it feeds the CS2 veto flow only.
--    The map for a PUBG match comes from the Krafton payload at ingestion time.
ALTER TABLE Maps
  ADD COLUMN game_id   TINYINT UNSIGNED NULL,
  ADD COLUMN code_name VARCHAR(64)      NULL UNIQUE,
  ADD CONSTRAINT fk_maps_game FOREIGN KEY (game_id) REFERENCES Games(id) ON DELETE SET NULL;

UPDATE Maps SET game_id = 1;  -- backfill all existing CS2 maps

INSERT INTO Maps (name, code_name, game_id) VALUES
  ('Erangel',  'Baltic_Main',     2),
  ('Miramar',  'Desert_Main',     2),
  ('Taego',    'Tiger_Main',      2),
  ('Vikendi',  'DihorOtok_Main',  2),
  ('Rondo',    'Neon_Main',       2),
  ('Deston',   'Kiki_Main',       2),
  ('Sanhok',   'Savage_Main',     2),
  ('Karakin',  'Summerland_Main', 2),
  ('Paramo',   'Heaven_Main',     2);
```

> Ingestion resolves `PubgMatches.map_id` by `mapName` → `Maps.code_name`. Unknown codes
> ingest with `map_id = NULL` (don't fail the match) and log for a follow-up seed.
>
> `SeasonActiveMapPool` is **CS2-only** — it supports the map-veto flow, which PUBG has no
> equivalent for. PUBG map rotation is configured in the Krafton custom lobby (outside our
> system); map assignment happens at ingestion, not via admin pre-configuration.

> `Games`, `GameTypes` (Duo/Squad), and `OrganizerGames` for org 1 are **already seeded** — no change needed.

### 6.2 PUBG player identity

Krafton keys players by `shard + playerName → accountId`. We anchor on the existing `steam_id` identity.

```sql
CREATE TABLE PubgPlayerIdentities (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  steam_id        BIGINT NOT NULL,                       -- FK SteamPlayers.steam_id
  shard           VARCHAR(32) NOT NULL DEFAULT 'steam',  -- steam/kakao/console/tournament
  pubg_account_id VARCHAR(255) NULL,                     -- "account.xxxxx" from Krafton
  pubg_name       VARCHAR(255) NOT NULL,                 -- in-game name (mutable on Krafton side)
  verified_at     TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  updated_at      TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pubg_account (shard, pubg_account_id),
  UNIQUE KEY uq_steam_shard (steam_id, shard),
  CONSTRAINT fk_pubgident_steam FOREIGN KEY (steam_id)
    REFERENCES SteamPlayers(steam_id) ON DELETE CASCADE
);
```

> Alternative considered: extend `LinkedAccounts.provider` enum with `'pubg'`. Rejected because we need `shard` and a mutable in-game `pubg_name` distinct from the stable `accountId`, which the 2-column `LinkedAccounts` shape can't hold cleanly. A dedicated table also matches the precedent set by `SteamPlayers.faceit_id`/`faceit_nickname`.

### 6.3 Scoring rules (configurable per season/stage)

PUBG points systems vary by ruleset (Super/ESL/custom). Make them data, not code.

```sql
CREATE TABLE PubgScoringRules (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  season_id         INT UNSIGNED NOT NULL,
  stage_id          INT UNSIGNED NULL,             -- null = season default
  -- COALESCE key so the UNIQUE below actually enforces "one default per season".
  -- A plain UNIQUE(season_id, stage_id) does NOT: MariaDB treats NULLs as distinct,
  -- so multiple (season_id, NULL) rows would slip through. The generated column
  -- folds NULL→0; stage_id itself stays a nullable FK to Stages (no id=0 sentinel row).
  stage_key         INT UNSIGNED AS (COALESCE(stage_id, 0)) STORED,
  kill_points       DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  placement_points  JSON NOT NULL,                 -- {"1":10,"2":6,"3":5,...}
  created_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  updated_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_season_stage (season_id, stage_key),
  CONSTRAINT fk_pubgrules_season FOREIGN KEY (season_id)
    REFERENCES Seasons(id) ON DELETE CASCADE,
  CONSTRAINT fk_pubgrules_stage  FOREIGN KEY (stage_id)
    REFERENCES Stages(id) ON DELETE CASCADE
);
```

### 6.4 PUBG match container

```sql
CREATE TABLE PubgMatches (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  season_id         INT UNSIGNED NOT NULL,
  league_id         INT UNSIGNED NOT NULL,
  stage_id          INT UNSIGNED NOT NULL,
  krafton_match_id  VARCHAR(255) NOT NULL,         -- Krafton "matchId"
  shard             VARCHAR(32) NOT NULL DEFAULT 'steam',
  map_id            TINYINT UNSIGNED NULL,         -- FK Maps.id
  game_mode         VARCHAR(64) NULL,              -- e.g. squad-fpp
  match_number      INT NULL,                      -- ordinal within the stage/day
  is_custom_match   TINYINT(1) NOT NULL DEFAULT 1,
  duration_seconds  INT NULL,
  played_at         TIMESTAMP NULL,                -- match attributes.createdAt
  telemetry_url     VARCHAR(1000) NULL,            -- offloaded (Allstar pattern)
  status            ENUM('DISCOVERED','INGESTING','INGESTED','FAILED','VOIDED')
                      NOT NULL DEFAULT 'DISCOVERED',
  created_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  updated_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_krafton_match (shard, krafton_match_id),
  KEY idx_season_stage (season_id, stage_id),
  CONSTRAINT fk_pubgmatch_sl FOREIGN KEY (season_id, league_id)
    REFERENCES SeasonLeagues(season_id, league_id) ON DELETE CASCADE,
  CONSTRAINT fk_pubgmatch_stage FOREIGN KEY (stage_id)
    REFERENCES Stages(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pubgmatch_map FOREIGN KEY (map_id)
    REFERENCES Maps(id) ON DELETE SET NULL
);
```

> Mirrors how `Matches` ties to `SeasonLeagues(season_id, league_id)` and `Stages`, and how `external_match_room_id` carried the FaceIT room — here `krafton_match_id` is the external key, uniqued per shard.

### 6.5 Team placement per match

```sql
CREATE TABLE PubgMatchRosters (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pubg_match_id     INT UNSIGNED NOT NULL,
  team_id           INT UNSIGNED NOT NULL,
  season_id         INT UNSIGNED NOT NULL,         -- duplicated for composite FK (MatchTeams pattern)
  league_id         INT UNSIGNED NOT NULL,
  krafton_roster_id VARCHAR(255) NULL,             -- roster id from telemetry/match
  placement         SMALLINT UNSIGNED NOT NULL,    -- rank 1..N
  won               TINYINT(1) NOT NULL DEFAULT 0,
  kills             SMALLINT UNSIGNED NOT NULL DEFAULT 0,   -- team kills (denormalised)
  placement_points  DECIMAL(6,2) NOT NULL DEFAULT 0,
  kill_points       DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_points      DECIMAL(6,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  updated_at        TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_match_team (pubg_match_id, team_id),
  CONSTRAINT fk_pubgroster_match FOREIGN KEY (pubg_match_id)
    REFERENCES PubgMatches(id) ON DELETE CASCADE,
  -- enforces team is actually registered in this season/league (MatchTeams composite-FK pattern)
  CONSTRAINT fk_pubgroster_slt FOREIGN KEY (season_id, team_id, league_id)
    REFERENCES SeasonLeagueTeams(season_id, team_id, league_id) ON DELETE CASCADE
);
```

> Deliberately reuses the project's **composite-FK integrity trick** (`README.database.md` §"Why Duplicate Data in MatchTeams") so a team can only score in matches for a season/league it is registered in — even if ingestion code has a bug.

### 6.6 Per-player match stats (BR-shaped)

```sql
CREATE TABLE PubgMatchPlayerStats (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pubg_match_id       INT UNSIGNED NOT NULL,
  pubg_roster_id      INT UNSIGNED NOT NULL,        -- FK PubgMatchRosters.id
  steam_id            BIGINT NULL,                  -- resolved via PubgPlayerIdentities (nullable: guests/unmapped)
  pubg_account_id     VARCHAR(255) NOT NULL,        -- participant playerId ("account.xxxx") — ALWAYS in the payload
  pubg_name           VARCHAR(255) NOT NULL,        -- snapshot of name at match time
  kills               SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  assists             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  dbnos               SMALLINT UNSIGNED NOT NULL DEFAULT 0,   -- knockdowns
  revives             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  headshot_kills      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  damage_dealt        DECIMAL(8,2) NOT NULL DEFAULT 0,
  longest_kill        DECIMAL(8,2) NOT NULL DEFAULT 0,
  kill_streaks        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  kill_place          SMALLINT UNSIGNED NULL,        -- killPlace: kill rank within the lobby
  road_kills          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  team_kills          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  vehicle_destroys    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  survival_time       INT NOT NULL DEFAULT 0,        -- timeSurvived, seconds
  walk_distance       DECIMAL(10,2) NOT NULL DEFAULT 0,
  ride_distance       DECIMAL(10,2) NOT NULL DEFAULT 0,
  swim_distance       DECIMAL(10,2) NOT NULL DEFAULT 0,
  heals               SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  boosts              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  weapons_acquired    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  win_place           SMALLINT UNSIGNED NULL,        -- team placement, denormalised
  death_type          VARCHAR(32) NULL,              -- observed: alive/byplayer/byzone/logout
  created_at          TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  updated_at          TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  -- Dedup/idempotency key anchors on the STABLE account id, not the mutable name.
  -- pubg_account_id is the participant's `playerId`, which is ALWAYS present in the match
  -- payload (§4, §8) — hence NOT NULL. That makes this UNIQUE a real idempotency guard:
  -- re-ingesting the same match upserts rather than duplicating. (The unmapped case is
  -- steam_id IS NULL — a participant we couldn't map to a Kanaliiga player — NOT a null
  -- account id; name is unreliable across re-ingests, so it is not part of the key.)
  UNIQUE KEY uq_match_player (pubg_match_id, pubg_account_id),
  KEY idx_steam (steam_id),
  CONSTRAINT fk_pubgpstats_match FOREIGN KEY (pubg_match_id)
    REFERENCES PubgMatches(id) ON DELETE CASCADE,
  CONSTRAINT fk_pubgpstats_roster FOREIGN KEY (pubg_roster_id)
    REFERENCES PubgMatchRosters(id) ON DELETE CASCADE
);
```

> `steam_id` is **nullable** by design: the Krafton match returns in-game names; we map back to `steam_id` via `PubgPlayerIdentities`, but ringers/unregistered guests in a custom lobby may not map. Unmapped rows are still stored for completeness and can be reconciled later (admin tool).

### 6.7 Ingestion log (the FaceitWebhooks analogue, poll-based)

```sql
CREATE TABLE PubgMatchIngestion (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  krafton_match_id  VARCHAR(255) NOT NULL,
  shard             VARCHAR(32) NOT NULL DEFAULT 'steam',
  season_id         INT UNSIGNED NULL,             -- resolved target, if known
  discovered_via    ENUM('player_poll','manual','tournament') NOT NULL DEFAULT 'player_poll',
  status            ENUM('PENDING','FETCHING','SAVED','SKIPPED','FAILED')
                      NOT NULL DEFAULT 'PENDING',
  raw_payload       LONGTEXT NULL,                 -- cache of match JSON for reprocess
  error_type        VARCHAR(255) NULL,
  error_details     TEXT NULL,
  retry_count       INT DEFAULT 0,
  manual_reprocess  TINYINT(1) DEFAULT 0,
  received_at       TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_match_attempt (shard, krafton_match_id)
);
```

> Directly mirrors `FaceitWebhooks` (`external_payload_id`, `event`, `data`, `error_type`, `retry_count`, `manual_reprocess`) so admins get the same reprocess/debug ergonomics, but the discovery source is a poll rather than an inbound event.

### 6.8 Standings — compute, don't store (initially)

Standings = `Σ total_points` per team within a (season, league, stage). Implement as a **service-layer aggregation** (or a SQL `VIEW`) over `PubgMatchRosters`, with PUBG tie-breakers (total points → most wins → most kills → best single-match placement). Avoid a materialised standings table until query cost demands it; it's derivable and a denormalised copy invites drift.

### 6.9 `MatchEvents` — the unified cross-game read view

This is how we get "all matches in one place" **without** one physical table (per §5.1 decision). A read-only view projects the columns shared by CS2 `Matches` and `PubgMatches`, so calendar / casting / cross-game listing query **one** surface and drill into the right backing table by `game_id`.

> ✅ **Column names verified against the live schema (2026-06-04).** `Matches` has
> `stage`, `start_timestamp`, `end_timestamp`, `external_match_room_id`, `season_id`,
> `league_id`, and `status` — the view below creates as written. `Matches.status` is an
> enum that includes `SCHEDULED`/`FINISHED`/`CANCELLED`, so the normalised `CASE` vocabulary
> is compatible.
>
> ⚠️ **Two read-layer limitations to carry into the calendar/casting work:**
>
> 1. **No upcoming PUBG fixtures.** `PubgMatches` rows only exist _after_ discovery
>    (`krafton_match_id NOT NULL`, ingestion is poll-only), so a PUBG match can never be
>    `SCHEDULED` in the forward-looking sense CS2 matches are. The cross-game calendar shows
>    **past** PUBG matches only — "all matches in one place" means _results_, not _fixtures_,
>    for PUBG. If pre-match PUBG fixtures are ever needed, that requires a nullable
>    `krafton_match_id` + a real scheduled status, bound to the Krafton id on ingest.
> 2. **Status collapse.** `DISCOVERED`/`INGESTING`/`FAILED` all fold to `SCHEDULED` in the
>    `ELSE` branch — a failed ingest reads as "scheduled" to consumers. Acceptable for a
>    listing surface; branch on `source='pubg'` + the backing `PubgMatches.status` if a
>    consumer needs the real ingestion state.

```sql
CREATE OR REPLACE VIEW MatchEvents AS
  -- CS2 (and any future Matches-based game)
  SELECT
    'cs2'                      AS source,
    m.id                       AS event_id,
    s.game_id                  AS game_id,
    s.organizer_id             AS organizer_id,   -- needed for tenant-scoped reads (multi-org)
    m.season_id, m.league_id, m.stage AS stage_id,
    m.status                   AS status,
    m.start_timestamp          AS start_timestamp,
    m.end_timestamp            AS end_timestamp,
    m.external_match_room_id   AS external_id
  FROM Matches m
  JOIN Seasons s ON s.id = m.season_id
  UNION ALL
  -- PUBG
  SELECT
    'pubg'                     AS source,
    pm.id                      AS event_id,
    s.game_id                  AS game_id,
    s.organizer_id             AS organizer_id,   -- needed for tenant-scoped reads (multi-org)
    pm.season_id, pm.league_id, pm.stage_id,
    -- normalise PUBG lifecycle onto the shared status vocabulary
    CASE pm.status
      WHEN 'INGESTED' THEN 'FINISHED'
      WHEN 'VOIDED'   THEN 'CANCELLED'
      ELSE 'SCHEDULED'
    END                        AS status,
    pm.played_at               AS start_timestamp,
    NULL                       AS end_timestamp,
    pm.krafton_match_id        AS external_id
  FROM PubgMatches pm
  JOIN Seasons s ON s.id = pm.season_id;
```

> Consumers (`calendar.*`, `match-streams.*`, cross-game "matches this week") read `MatchEvents` and branch on `source`/`game_id` to fetch detail from the correct domain. Existing CS2 queries keep hitting `Matches` directly and are untouched. If Option C (a true game-neutral container) is ever pursued, this view is the seam to migrate behind.

---

## 7. Backend code structure (following existing conventions)

Layering stays `routes → controllers → services → models → db` (per `README.architecture.md`), with Zod schemas in `schemas/` and types/factories in `packages/types/src/db/`.

### New files

```
apps/backend/src/
  services/
    pubg-api.services.ts          # fetch wrappers: getPubgPlayers, getPubgMatch,
                                   #   getTelemetry — Bearer key from PUBG_API_KEY env, Redis cache,
                                   #   token-bucket throttle (10 rpm). Mirror faceit-match.services.ts.
    pubg-ingestion.services.ts    # discover match IDs (player poll / manual / tournament),
                                   #   dedupe via PubgMatchIngestion, enqueue jobs.
    pubg-match.services.ts        # transform Krafton JSON:API → domain rows; apply scoring rules.
    pubg-standings.services.ts    # aggregate PubgMatchRosters → standings + tie-breakers.
    pubg-poller.services.ts       # BullMQ queue + worker (rate-limited), or cron-scheduler hook.
  models/
    pubg-match.models.ts          # CRUD for PubgMatches / PubgMatchRosters (saveParsedMatch…).
    pubg-player-stats.models.ts   # bulk insert PubgMatchPlayerStats (mirror player-stats.models.ts).
    pubg-identity.models.ts       # PubgPlayerIdentities lookups + steam_id resolution.
    pubg-scoring-rules.models.ts
  controllers/
    pubg-matches.controllers.ts   # GET matches/standings; POST admin manual match-id ingest.
    pubg-identity.controllers.ts  # link/verify PUBG account to logged-in steam user.
  routes/v1/
    pubg.routes.ts                # /api/v1/pubg/...  (admin guards on ingest/scoring config)
  schemas/
    pubg.schemas.ts               # Zod request/response validation
packages/types/src/db/
    PubgMatch.interface.ts (+ .test-utils.ts)         # createMockPubgMatch
    PubgMatchRoster.interface.ts (+ .test-utils.ts)
    PubgMatchPlayerStat.interface.ts (+ .test-utils.ts)
    PubgPlayerIdentity.interface.ts (+ .test-utils.ts)
    PubgScoringRule.interface.ts (+ .test-utils.ts)
```

### Ingestion flow (the heart of it)

```
[Cron / BullMQ poller every N min during active season]
  1. pubg-poller: for each registered roster's known player → getPubgPlayers(shard, names)
       (batch ≤10 names/request to respect rate limit; cache 24h)
  2. Collect recent matchIds where isCustomMatch && createdAt ∈ active window
  3. Upsert into PubgMatchIngestion (status=PENDING), dedupe on (shard, matchId)
  4. Enqueue one ingest job per new matchId
  [Worker, concurrency 1, throttled]
  5. getPubgMatch(shard, matchId)  → cache raw JSON in ingestion row + Redis
  6. pubg-match.services: map rosters→PubgMatchRosters, participants→PubgMatchPlayerStats
       - resolve steam_id via PubgPlayerIdentities (shard, account_id / name)
       - load PubgScoringRules(season, stage) → compute placement/kill/total points
  7. Persist in a transaction (PubgMatches + rosters + player stats); set status=INGESTED
  8. Store telemetry_url; (optional later) enqueue telemetry parse for advanced stats
  9. On error → status=FAILED, error_type/details, retry with backoff (BullMQ),
       admin can flip manual_reprocess (same UX as FaceitWebhooks)
```

Admins can also `POST /api/v1/pubg/matches/ingest { krafton_match_id, season_id, stage_id }` to inject a known custom-match ID directly (step 3 onward), covering the case where auto-discovery misses a lobby.

---

## 8. Domain logic notes & decisions

- **Match-to-stage assignment.** A Krafton lobby has no notion of "which Kanaliiga stage". We resolve it by: (a) manual admin assignment at ingest, or (b) inferring from the participating rosters' registered season/league + the `played_at` window. v1: require `season_id`/`stage_id` on the ingest job (explicit > clever).
- **Roster ↔ team matching (the critical rule).** The sample payload confirms `roster.relationships.team.data` is **`null`** and `roster.stats.teamId` is only an **in-lobby slot number** — neither identifies a Kanaliiga team. The _only_ link is: each participant's `playerId` (`account.xxxx`) → `PubgPlayerIdentities.pubg_account_id` → `steam_id` → the team that player is rostered on in `SeasonTeamPlayers` for this season/league. The Kanaliiga team owning a roster = the one with the **most matched primary players** in that 4-player roster. Flag rosters where < N players resolve (guests/ringers) for admin review, and let admins override the mapping.
- **Scoring is data-driven.** Never hard-code a points table; read `PubgScoringRules`. Recompute points idempotently so a ruleset correction can re-derive `PubgMatchRosters.*_points` without re-fetching from Krafton (raw payload is cached).
- **Idempotency.** Re-ingesting the same `krafton_match_id` upserts, never duplicates (uniques on `(shard, krafton_match_id)`, `(pubg_match_id, team_id)`, and `(pubg_match_id, pubg_account_id)` — the participant's stable `playerId`, always present in the payload, rather than the mutable `pubg_name`).
- **Identity verification.** Players link a PUBG name during signup; verify by checking the name resolves on the correct shard via the API. Store `verified_at`. Keep `pubg_name` as a per-match snapshot too, because Krafton names are mutable.
- **GDPR / retention.** PUBG stats are gameplay data tied to a `steam_id`; they follow the same minimal-audit posture. Telemetry stays offloaded (URL only) like Allstar demos.

---

## 9. Phased rollout

| Phase                       | Deliverable                                                                                                                                                                                                                                  | Notes                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **0. Spike**                | ✅ Mostly done — `PUBG_API_KEY` provisioned (env + GitLab CI/CD + deploy compose); a real custom match is captured in `docs/pubg/pubg_matchdata-example.json`. **Remaining:** confirm the live ~10 rpm limit against the key.                | De-risks §4 assumptions before schema is frozen                             |
| **1. Foundation**           | Migrations 6.1–6.7, types + `createMockX` factories, `platform='krafton'` — **`platform='krafton'` ✅ done 2026-06-05**                                                                                                                      | No behaviour change; CS2 untouched                                          |
| **2. Identity & signup**    | `PubgPlayerIdentities`, link/verify endpoint, PUBG season + Squad registration end-to-end (reuses existing flow) — **signup player-limits infrastructure ✅ done 2026-06-05** (`SeasonSignupSettings`, per-season min/max, full stack wired) | Proves the reusable spine                                                   |
| **3. Ingestion**            | `pubg-api.services` + poller + manual-ingest endpoint + `PubgMatchIngestion`; persist `PubgMatches`/rosters/stats                                                                                                                            | The core engineering work                                                   |
| **4. Scoring & standings**  | `PubgScoringRules` admin config + standings aggregation + public read endpoints                                                                                                                                                              | Data-driven points                                                          |
| **4b. Unified read view**   | `MatchEvents` view (§6.9) + point `calendar`/`match-streams` at it so PUBG appears in the cross-game calendar/casting                                                                                                                        | "All matches in one place" = PUBG **results**, not upcoming fixtures (§6.9) |
| **5. Telemetry (optional)** | Parse telemetry CDN for advanced stats (knock timelines, heat positioning)                                                                                                                                                                   | Allstar-style, on demand                                                    |
| **6. PUBG ranking (later)** | A PUBG analogue to Sortter/kana_elo for auto-division balancing                                                                                                                                                                              | Out of v1                                                                   |

Each phase is independently shippable and gated behind `season.platform='krafton'`, so CS2 is never at risk.

---

## 10. Risks & open questions

1. **Rate limit (10 rpm)** is the dominant operational constraint. With many rosters to poll, batch player lookups (≤10 names) and cache hard. Confirm whether Kanaliiga can get an elevated/tournament key.
2. **Custom-match discovery reliability** — auto-discovery depends on a registered player appearing in the lobby and polling within 14 days. The manual ingest endpoint is the safety net; make it first-class, not an afterthought.
3. **Tournament shard / esports code** — if Kanaliiga is granted a PUBG Esports tournament code, the `/tournaments` endpoints replace player-polling discovery and remove the 14-day pressure. Worth pursuing with Krafton.
4. **Name ↔ steam_id mapping gaps** — mutable PUBG names and guests. Mitigated by `accountId` anchoring + `verified_at` + admin reconciliation UI.
5. **Stage assignment ambiguity** — solved in v1 by explicit admin assignment; revisit auto-inference once volume justifies it.
6. **Sortter dependency** — confirm with product that **manual division assignment** is acceptable for PUBG v1 (no kana_elo equivalent exists).

---

## 11. Bottom line

The architecture's **deliberate game-agnostic spine (game/organizer/season/league/team/registration/RBAC) carries PUBG almost for free** — and PUBG is already registered in `Games`/`GameTypes`/`OrganizerGames`. The real work is a **self-contained battle-royale match-and-stats domain** plus a **rate-limited polling ingestion pipeline** for the Krafton API, sitting cleanly alongside (not inside) the CS2 match model. This isolates risk, preserves the SQL-enforced CS2 guarantees, and reuses the existing Redis/BullMQ/cron, identity, and RBAC infrastructure. The "all matches in one place" goal is met at the **read layer** via the `MatchEvents` view (§6.9) rather than by overloading the CS2 `Matches` table — which would have coupled ~287 head-to-head query sites to a 16-roster row shape. Estimated net-new surface: **~7 tables + 1 view, ~12 backend modules, 1 enum value, a handful of map rows** — concentrated, well-bounded, and shippable in phases.
