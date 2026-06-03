# Frontend Architecture — Multi-Organizer, Multi-Game

> **Status:** Design proposal (not yet implemented). Companion to
> [`multi-tenant-architecture.md`](multi-tenant-architecture.md) (platform/backend/auth)
> and [`pubg-implementation-plan.md`](pubg-implementation-plan.md) (the first second-game).
>
> **Naming placeholders** (the umbrella brand is not decided): `{platform-name}` = the
> umbrella product, `{apex-domain}` = its apex domain (e.g. the thing tenants are
> subdomains of), `{org}` = an organizer slug. Concrete tenant examples use **Kanaliiga**,
> **Pappaliiga**, **Suomiliiga**; concrete games use **cs2** / **pubg**. Replace
> placeholders once the brand/domain are chosen.

---

## 1. Goal

Evolve the frontend from a **single-organizer (Kanaliiga), single-game (CS2)** app into a
**multi-tenant platform** where each organizer is a tenant with its own brand, running one
or more games, served by **one shared frontend deployment** (see the architecture doc for
why pooled, not per-tenant). Adding a game = a config entry + a view module; adding an
organizer = a DB row + theme + DNS. Neither is a rewrite.

---

## 2. Current state (what we're starting from)

The data layer is already game-parameterized; the **presentation layer is hardwired**:

| Location                                      | Today                                      | Implication                                   |
| --------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| `app/(main)/(content-container)/layout.tsx`   | `<FilterProvider appId="730">`             | CS2 hardcoded into the shell                  |
| `lib/season-utils.ts`                         | `const CS2_GAME_ID = 1`                    | game identity is a literal                    |
| `components/dashboard/seasons/SeasonForm.tsx` | `organizer_id: 1` default                  | organizer is implicit                         |
| Routes                                        | flat: `/seasons`, `/matches`, `/players`   | implicitly Kanaliiga + CS2                    |
| `app/(embed)/calendar`                        | **takes `organizer_id` + `app_id` params** | tenancy seam already exists at the data layer |
| Type `ActiveSignupOrSeasonForAppId`           | seasons fetched by `app_id`                | backend is already game-scoped                |

So this is **promoting two values that already flow through the system — organizer and
game — from hardcoded constants to first-class, data-driven context.** Not new plumbing.

---

## 3. The two axes

Tenancy has two independent dimensions, handled differently:

- **Organizer = the tenant/brand** (Kanaliiga, Pappaliiga, Suomiliiga). Resolved from the
  **host** (subdomain by default, vanity domain on upgrade — see architecture doc §URL).
  Provides theme, logo, social links, and the set of games it runs.
- **Game = a scope inside a tenant** (cs2, pubg). Carried in the **URL path**. Selects
  which seasons/matches you see, which capabilities are enabled, and which game-specific
  view modules render.

> Organizer = outer provider (theming + which games exist). Game = URL scope (which data +
> which views + which capabilities). Keep them separate; conflating them is what makes
> multi-tenant frontends rot.

---

## 4. Information architecture & routing

### 4.1 Public URL shape

```
{organizer-host}/{game}/{resource}
```

| Brand          | Branded (prod)                            | Hub / path form (dev, previews, umbrella) |
| -------------- | ----------------------------------------- | ----------------------------------------- |
| Kanaliiga CS2  | `kanaliiga.{apex-domain}/cs2/seasons/12`  | `{apex-domain}/kanaliiga/cs2/seasons/12`  |
| Kanaliiga PUBG | `kanaliiga.{apex-domain}/pubg/standings`  | `{apex-domain}/kanaliiga/pubg/standings`  |
| Pappaliiga CS2 | `pappaliiga.{apex-domain}/cs2/matches/88` | `{apex-domain}/pappaliiga/cs2/matches/88` |
| Vanity upgrade | `kanaliiga.fi/cs2/seasons/12`             | (same internal route)                     |
| Umbrella hub   | `{apex-domain}` → organizer directory     | —                                         |

- **Organizer by host** because Kanaliiga/Pappaliiga are _established brands_ that want
  their own identity (and, on upgrade, their own domain). Host-based tenancy is the
  standard multi-tenant pattern.
- **Game by path** because games live _inside_ an organizer; `/cs2`, `/pubg` read
  naturally and avoid an org×game subdomain explosion.

### 4.2 One internal route, two addressing forms

The tenant is resolved at the **edge** (Next.js middleware) and _both_ the branded host and
the hub path rewrite into a single internal route, so all surfaces share one codebase:

```
kanaliiga.{apex-domain}/cs2/seasons/12  ─┐  middleware reads Host → organizer
{apex-domain}/kanaliiga/cs2/seasons/12  ─┴─►  internal:  /kanaliiga/cs2/seasons/12
```

Internal App Router tree:

```
app/[organizer]/[game]/(content)/
  page.tsx                  # org+game landing (active season highlights)
  seasons/[season]/...      # standings, schedule, results
  matches/[id]/...          # renders Cs2MatchDetail | PubgMatchDetail via view registry (§7)
  standings/  leaderboards/  teams/[id]/  signup/
app/[organizer]/[game]/dashboard/   # admin, scoped to this org+game (§9)
app/(hub)/                          # apex: organizer directory, global player search (§8)
app/(embed)/                        # widgets, already param-based (§10)
```

- `middleware.ts` — `Host` → organizer (cached lookup against `Organizers.primary_host` /
  `{slug}.{apex-domain}`); rewrites a branded host to the `/[organizer]` prefix, or
  validates the explicit prefix on the hub domain. (Details in the architecture doc.)
- `app/[organizer]/layout.tsx` — resolves the `Organizers` row → **`OrganizerProvider`**.
- `app/[organizer]/[game]/layout.tsx` — validates `game` against **`OrganizerGames`** for
  this org (404 if Pappaliiga doesn't run PUBG), sets **`GameProvider`** + capabilities,
  and feeds `FilterProvider` its `appId` (replacing the hardcoded `"730"`).

`/` on a branded host redirects to the org's default game (`OrganizerGames.is_default`,
e.g. `kanaliiga.{apex-domain}/` → `/cs2`).

---

## 5. Context providers

Replace the hardcoded constants with two resolved providers, nested by the route tree.

```
OrganizerProvider   (app/[organizer]/layout.tsx)
  ├─ organizer: { id, slug, name, theme, logo, discordLink, enabledGames }
  └─ GameProvider   (app/[organizer]/[game]/layout.tsx)
        ├─ game: { id, slug, appId, capabilities, matchModel }
        └─ FilterProvider appId={game.appId}   ← was <FilterProvider appId="730">
```

- **`OrganizerProvider`** — themes the shell (logo, colors, social links from the
  `Organizers` row), exposes `enabledGames` for the switcher. Resolved server-side.
- **`GameProvider`** — exposes the game's capability config (§6) so every component branches
  on capability, not on a hardcoded id.

This is the "lift the hardcodes into context" step; doing it first is a pure refactor with
no visible change and de-risks everything after.

---

## 6. Game capability config — the single most important pattern

Instead of scattering `game_id === 1` / `appId === "730"` checks, define **one declarative
registry** the UI reads. Every game-conditional decision consults a capability.

```ts
// lib/games/registry.ts
export const GAME_CONFIG = {
  cs2: {
    slug: "cs2",
    appId: 730,
    matchModel: "h2h",
    statsKind: "round",
    caps: {
      mapVeto: true,
      demoParsing: true,
      fantasy: true,
      sortter: true,
      rosterSize: 5
    }
  },
  pubg: {
    slug: "pubg",
    appId: 578080,
    matchModel: "battle-royale",
    statsKind: "placement",
    caps: {
      mapVeto: false,
      demoParsing: false,
      fantasy: false,
      sortter: false,
      rosterSize: 4
    }
  }
} as const;

export type GameSlug = keyof typeof GAME_CONFIG;
```

- Does the dashboard show "Map Veto" or "Match Ingestion"? → `caps.mapVeto`.
- Does the match page render a scoreboard or a placement table? → `matchModel`.
- Is there a Fantasy tab? → `caps.fantasy`.

**Adding a game = one entry here + its view module (§7). No `if`-hunting across the app.**

> The config is keyed by slug but should be reconcilable with the DB (`Games.app_id`,
> `GameTypes`), so the source of truth for _which games exist_ stays in `OrganizerGames`;
> the registry only holds _frontend behavior_ per known game.

---

## 7. Game view registry

Map each game to its game-specific components, rendered behind shared shells.

```ts
// lib/games/views.ts
export const GAME_VIEWS: Record<GameSlug, GameViews> = {
  cs2: {
    MatchDetail: Cs2MatchDetail,
    Leaderboard: Cs2Leaderboard,
    SignupExtras: Cs2SignupExtras
  },
  pubg: {
    MatchDetail: PubgMatchDetail,
    Leaderboard: PubgStandings,
    SignupExtras: PubgSignupExtras
  }
};
```

- **Shared chrome** (nav, season selector, team pages, calendar, registration flow) stays
  one codebase.
- **Game-specific leaves** (match detail, stats tables, leaderboard columns, signup extras
  like the PUBG name/shard field) swap via the registry.
- The cross-game calendar / match list reads the **`MatchEvents` view**
  (see PUBG plan §6.9) and routes into the correct `MatchDetail` by `source` / `game_id`.

This pattern is what makes "another game" additive rather than a fork.

---

## 8. Navigation, theming, and cross-tenant entities

### 8.1 Game switcher (data-driven)

A header switcher lists **the current organizer's games from `OrganizerGames`** (not a
hardcoded list) and swaps the `[game]` segment. Enable a game in the DB → it appears
automatically.

### 8.2 Organizer theming

`OrganizerProvider` themes the shell from the `Organizers` row (logo, colors, Discord
links — fields that already exist on the table). No per-tenant code.

### 8.3 Players and teams are cross-tenant

`SteamPlayers` and `Teams` are **shared across all organizers and games** — the same person
can play Kanaliiga CS2 _and_ Pappaliiga PUBG. So:

- **Scoped views** under a tenant: `kanaliiga.{apex-domain}/cs2/players/[steamId]` = that
  player's Kanaliiga-CS2 record.
- **Canonical global profile** at the hub: `{apex-domain}/players/[steamId]` = aggregated
  across every org + game.

Make the **hub profile canonical** (link scoped pages to it) to avoid duplicate-content/SEO
problems and "which stats am I seeing" confusion.

---

## 9. Admin dashboard — game-conditional tooling

The dashboard is where game divergence bites hardest. Drive tool visibility off the
selected season's game capabilities (§6):

| Tool                                                                                                    | CS2    | PUBG                  |
| ------------------------------------------------------------------------------------------------------- | ------ | --------------------- |
| Map Veto, Manual Demo Parse, Failed-Parse, Sortter                                                      | shown  | **hidden**            |
| PUBG Match Ingestion (paste/auto-discover Krafton IDs, `PubgMatchIngestion` status, `PubgScoringRules`) | hidden | **shown**             |
| Registration, Role management, Players, Sponsors, Casters                                               | shown  | shown (game-agnostic) |

The season-creation form already carries `organizer_id` / `game_id` / `game_type_id` — the
change is that downstream tooling renders by capability, and an org-admin only sees **their
tenant's** data (authorization gains an organizer dimension — see architecture doc).

---

## 10. Embeds

The embed widgets (`app/(embed)/calendar`) **already accept `organizer_id` + `app_id`**, so
they are the one surface that's effectively multi-tenant today. Keep that param-based
contract; it doubles as the proof that the data layer is tenant-ready. New games/orgs need
no embed change beyond passing the right params.

---

## 11. Migration / phasing (from today's single-tenant app)

Each phase is independently shippable; early phases are invisible refactors that de-risk the
rest.

| Phase                                       | Deliverable                                                                                                                                                                                                        | Visible change?          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| **F1. De-hardcode into context**            | `OrganizerProvider` + `GameProvider`; `FilterProvider` reads `appId` from game context; remove `CS2_GAME_ID = 1`, `appId="730"`, `organizer_id: 1` literals. CS2 becomes "the default game," not the implicit one. | No                       |
| **F2. Capability config + view registry**   | Add `GAME_CONFIG` and `GAME_VIEWS`; refactor existing CS2 views to live behind the registry.                                                                                                                       | No                       |
| **F3. Game switcher from `OrganizerGames`** | Dynamic switcher; still single organizer.                                                                                                                                                                          | Minor (switcher appears) |
| **F4. `/[game]` path scope**                | Introduce the game segment; **301 redirect** flat routes (`/seasons/123` → `/cs2/seasons/123`).                                                                                                                    | URLs change (redirected) |
| **F5. PUBG view modules + dashboard tools** | `PubgMatchDetail`, `PubgStandings`, `PubgSignupExtras`; game-conditional dashboard.                                                                                                                                | Yes (PUBG goes live)     |
| **F6. `/[organizer]` host tenancy**         | Middleware host→organizer rewrite, `OrganizerProvider` from `Organizers` row, hub directory. Needed only when a real second organizer appears.                                                                     | Yes (multi-org)          |

> Phases F1–F5 deliver **multi-game under Kanaliiga** (the immediate PUBG need) with **zero
> organizer work**. F6 adds the second organizer when it's real — the architecture doc's
> backend/auth changes pair with this phase.

---

## 12. Open questions

- **Umbrella brand & apex domain** — placeholders until decided; affects hub routing and
  canonical URLs.
- **Default-game rule** — `OrganizerGames.is_default` flag vs. "most recent active season's
  game"? (Affects the `/` redirect.)
- **Player profile canonicalization** — confirm hub-level canonical vs. tenant-scoped (§8.3).
- **Locale** — current app is FI/EN-ish; is locale a third axis (path segment? per-org
  default?) or out of scope here?
