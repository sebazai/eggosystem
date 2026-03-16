---
name: Double elimination playoff tree
overview: Add a backend API that returns playoff matches (stage=2) by season/league with round, group, teams, and scores, and a frontend page that renders a double-elimination bracket (upper = group 1, lower = group 2, grand final = group 3) with rounds and links to matches.
todos:
  - id: types-playoff-bracket
    content: Add PlayoffBracketMatch type in packages/types (matches/)
    status: completed
  - id: backend-model
    content: Implement getPlayoffBracketMatches in match.models.ts
    status: completed
  - id: backend-route-controller
    content: Add GET playoff bracket route and controller (dedicated /api/v1/playoff/...)
    status: completed
  - id: frontend-hook
    content: Add usePlayoffBracket hook (apps/frontend)
    status: completed
  - id: frontend-page
    content: Add seasons/[season]/leagues/[league_id]/playoff page
    status: completed
  - id: frontend-bracket-component
    content: Build PlayoffBracket component (upper, lower, final; click→match room; score; winner green border)
    status: completed
  - id: frontend-nav
    content: Add "Playoff bracket" to season menu in Navigation.tsx
    status: completed
isProject: false
---

# Double elimination playoff tree

## Data model (already in place)

- **Matches**: `stage` (2 = playoff), `group` (1 = upper, 2 = lower, 3 = grand final), `round` (1, 2, 3...) — [match.models.ts](apps/backend/src/models/match.models.ts) and [Match.interface.ts](packages/types/src/db/Match.interface.ts).
- DB has playoff data with group/round populated (e.g. group 1 rounds 1–4, group 2 rounds 2–6, group 3 round 1). Matches with `stage = 2` and null group/round exist but are legacy; bracket view will only list matches that have both `group` and `round` set.
- **FaceIT / when do we have lower bracket slots?** We receive playoff tree data via FaceIT `match_object_created` (or equivalent) when a match is created — typically when both teams are known (e.g. after an upper-bracket match is played and a loser drops to lower). We **do not generate** lower-bracket slots in code: we only display matches that exist in the DB. If a lower-bracket match does not exist yet (no webhook yet), that slot is shown as empty or “TBD”. No backend logic to create or infer missing bracket matches.

## Data source (current): FaceIT API + Redis

- Bracket is built from **GET championships/{id}/matches?limit=100**. API does not guarantee item order. Controller orders by round, group, and playoff_seed-derived slot (from SeasonLeagueTeams). BYE factions supported. Cached in Redis 7 days; invalidated on match_object_created (championship). SeasonLeagueExternalIds (stage_id=2) resolve season+league → championship_id.

## Backend

### 1. Playoff bracket data (FaceIT API + cache)

- **Service**: [apps/backend/src/services/playoff-bracket.services.ts](apps/backend/src/services/playoff-bracket.services.ts) — `getChampionshipMatchesCached(championshipId)` fetches from FaceIT or Redis (key `faceit-championship-matches:{id}`, TTL 7 days). Returns items in API order (undefined); controller sorts by round, group, playoff_seed-derived slot. `invalidateChampionshipMatchesCache(championshipId)` used on match_object_created.
- **Resolution**: [getPlayoffExternalIdBySeasonAndLeague](apps/backend/src/models/season-league-external-id.models.ts) gets championship external_id by season_id + league_id (stage_id = 2). [getPlayoffMatchIdsByExternalRoomIds](apps/backend/src/models/match.models.ts) maps FaceIT match_id → our Match.id for links. [getTeamIdsByExternalIds](apps/backend/src/models/season-league-team.models.ts) maps faction_id → our team_id when available.
- **Types**: [ChampionshipMatchesResponse.interface.ts](packages/types/src/faceit/ChampionshipMatchesResponse.interface.ts) for the FaceIT response; controller maps to existing `PlayoffBracketMatch`.

### 2. API route and controller

- **Route (REST-style)**: Use a **dedicated playoff resource** so the path reflects the resource, not “calendar” (calendar = schedule view; bracket = tree structure). Recommended: `**GET /api/v1/playoff/seasons/:season_id/leagues/:league_id/bracket` — resource = playoff bracket, scoped by season and league. Add a playoff router (e.g. [playoff.routes.ts](apps/backend/src/routes/v1/playoff.routes.ts)) and mount it; reuse [validateNumericParams](apps/backend/src/middlewares/validate-numeric-params.middleware.ts).
- **Controller**: New controller (e.g. [playoff.controllers.ts](apps/backend/src/controllers/playoff.controllers.ts)) that parses `season_id` and `league_id`, calls `getPlayoffBracketMatches(seasonId, leagueId)`, returns JSON. Return empty array when no playoff matches exist (no 404).

### 3. Types

- Add a **PlayoffBracketMatch** (or similar) type in `packages/types` (e.g. under `matches/`) with: `match_id`, `round`, `group`, `status`, `best_of`, `start_timestamp`, `team1_id`, `team1_name`, `team1_logo`, `team2_id`, `team2_name`, `team2_logo`, `team1_score`, `team2_score`. Use it in the backend response and frontend.

---

## Frontend

### 4. Data hook

- **New hook**: e.g. `usePlayoffBracket(seasonId: string, leagueId: string | number)` in `apps/frontend/src/hooks/data/` that calls `**/api/v1/playoff/seasons/:season_id/leagues/:league_id/bracket` (same fetcher pattern as [useSeasonCalendarMatches.tsx](apps/frontend/src/hooks/data/useSeasonCalendarMatches.tsx)). Return SWR result (data, isLoading, error, mutate).

### 5. Playoff page and routing (season + league from URL)

- **URL and route**: Put the bracket at `**seasons/[season]/leagues/[league_id]/playoff`** so **season** and **league are inferred from path params (shareable, bookmarkable).
- **Page behavior**:
  - Read `season` and `league_id` from route params; fetch season details for title/metadata (same pattern as [calendar/page.tsx](<apps/frontend/src/app/(main)/(content-container)/seasons/[season]/calendar/page.tsx>)).
  - **League selector on page**: Dropdown (or select) using [useSeasonLeagues](apps/frontend/src/hooks/data/useSeasonLeagues.ts); changing league **navigates** to `seasons/[season]/leagues/[new_league_id]/playoff` so the URL stays the source of truth.
  - Call `usePlayoffBracket(seasonId, leagueId)` with params from the URL; pass data into the bracket component. Empty state when no playoff data for that league.
- **Entry from nav**: When the user has no league in context, link to a default league (e.g. first league). See Navigation below.

### 6. Bracket UI component (layout + mobile)

- **Component**: e.g. `PlayoffBracket` or `DoubleEliminationBracket` under `apps/frontend/src/components/playoff/` (or `components/bracket/`).
- **Single-page layout (no tabs)**: Upper bracket, lower bracket, and grand final all on the same page — unlike FaceIT’s tabbed view.
- **Section order and layout**:
  - **Upper bracket** first (group 1, rounds 1 → 2 → 3 → …).
  - **Lower bracket** directly below (group 2, rounds in order).
  - **Grand final** (group 3): **on wide viewports**, place to the right of upper+lower (e.g. two columns: left = upper+lower stacked, right = grand final). **When that doesn’t fit (e.g. mobile)**, put the grand final **all the way at the bottom** below the lower bracket. Use CSS (flex/grid) and breakpoints so the layout stacks vertically on small screens and uses side‑by‑side only when there is enough width.
- **Mobile-first / responsive**: Layout must work on mobile: vertical stack (upper → lower → final), readable text, touch-friendly match cards and links, horizontal scroll only if needed for a single round row (avoid full-page horizontal scroll). Test at narrow viewport.
- **Match cells**:
  - **Click → match room**: Pressing / clicking the match (whole card or primary area) must navigate to the **match room** (match detail page): `/matches/[match_id]`. Use a link or clickable card so the match is the primary target.
  - Team 1 vs Team 2, optional logos. **Score**: For finished matches show match score (e.g. **2-1**, **2-0** for BO3) from `team1_score`–`team2_score`. For not finished, show “TBD” or “–”.
  - **Winner highlight**: When the match is finished (e.g. `status === 'FINISHED'`), determine the winner (team with higher game wins). Show a **green border** on the **winning team’s** row/side in the cell (e.g. left team wins → green border on left; right team wins → green border on right). Use **existing Tailwind/shadcn theme** (e.g. `border-green-500` or shadcn success border if present in theme). Loser side has no special border. This makes 2-1 and 2-0 outcomes clear at a glance.
  - Group matches by `(group, round)` from API. Empty slots (no match in DB yet) as blank or “TBD”.
- **Accessibility**: Headings for “Upper bracket”, “Lower bracket”, “Grand final”; clear labels and semantics for match cards.

### 7. Navigation (where to place the link)

- **Place**: Add **“Playoff bracket”** to the **season dropdown menu** in [Navigation.tsx](apps/frontend/src/components/layout/Navigation.tsx), inside `getSeasonMenuItems` (alongside “Standings”, “Calendar”, “Captains”, etc.).
- **Link target**: Link to `**/seasons/[season_id]/leagues/1/playoff`** (league id **1 as default). If league 1 does not exist or has no playoff data for that season, the page shows an empty state; no redirect or fallback.
- **Result**: Season and league are always inferred from the URL on the playoff page; the nav item is a single click into a specific season+league bracket.

---

## Flow summary

```mermaid
flowchart LR
  API["GET playoff-bracket"]
  Controller["playoff controller"]
  SLEI["SeasonLeagueExternalIds"]
  Redis["Redis cache"]
  FaceIT["FaceIT championships/matches"]
  Page["Playoff page"]
  Bracket["PlayoffBracket component"]
  API --> Controller
  Controller --> SLEI
  Controller --> Redis
  Redis --> FaceIT
  Controller --> "map to PlayoffBracketMatch"
  Page --> usePlayoffBracket
  usePlayoffBracket --> API
  Page --> Bracket
  Bracket --> "group 1"
  Bracket --> "group 2"
  Bracket --> "group 3"
  Webhook["match_object_created"] --> "invalidate cache"
```

---

## Todos (implementation order)

| #   | Todo                                   | Notes                                                                                                                                                                |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Add PlayoffBracketMatch type**       | `packages/types` (e.g. under `matches/`). Fields: match_id, round, group, status, best_of, start_timestamp, team1/2 id, name, logo, team1_score, team2_score.        |
| 2   | **Backend: getPlayoffBracketMatches**  | [match.models.ts](apps/backend/src/models/match.models.ts). Filter stage=2, round/group not null; join teams + game scores; order by group, round.                   |
| 3   | **Backend: route + controller**        | GET `/api/v1/playoff/seasons/:season_id/leagues/:league_id/bracket` (dedicated playoff router); validate params; return JSON (empty array when no matches).          |
| 4   | **Frontend: usePlayoffBracket hook**   | Fetch `/api/v1/playoff/seasons/.../bracket`; SWR; params from URL (seasonId, leagueId).                                                                              |
| 5   | **Frontend: playoff page**             | Route `seasons/[season]/leagues/[league_id]/playoff`. Season details, league selector (navigate on change), render bracket or empty state.                           |
| 6   | **Frontend: PlayoffBracket component** | Upper → lower → final (final right on desktop, bottom on mobile). Match cells: clickable → match room, score (2-1/2-0), green border on winner. TBD for empty slots. |
| 7   | **Frontend: navigation**               | Add "Playoff bracket" in [Navigation.tsx](apps/frontend/src/components/layout/Navigation.tsx) season menu → `/seasons/[season_id]/leagues/1/playoff`.                |

---

## Decisions (locked in)

- **Default league**: Nav link = `/seasons/[season_id]/leagues/1/playoff`. If league 1 does not exist or has no playoff data, show empty state.
- **API path**: **REST-style** — dedicated playoff resource: `**GET /api/v1/playoff/seasons/:season_id/leagues/:league_id/bracket` (not under calendar; bracket is its own resource scoped by season+league).
- **Winner green**: Use **existing Tailwind/shadcn theme** (e.g. `border-green-500` or shadcn success border if in theme).

---

## Out of scope for this plan

- Grand final “reset” (group 3, round 2) handling: data model supports it; UI can show it as another round in group 3 if present.
- Editing bracket (admin): read-only view only.
- Matches with `stage = 2` but null group/round: not shown in bracket; can be listed elsewhere or ignored.
