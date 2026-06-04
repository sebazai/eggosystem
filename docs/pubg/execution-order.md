# Execution Order & Branch Strategy — CS Refactor → PUBG → Multi-Org

> **Status:** Sequencing decision (2026-06). This is the **ordering authority** across the
> three planning docs — it does not restate their phases, it interleaves them and pins the
> git/merge strategy. Per-track detail lives in:
> [`pubg/frontend-multi-tenant.md`](pubg/frontend-multi-tenant.md) §11 (frontend F1–F6),
> [`pubg/pubg-implementation-plan.md`](pubg/pubg-implementation-plan.md) §9 (PUBG phases 0–6),
> [`multi-tenant-architecture.md`](multi-tenant-architecture.md) §10 (backend/auth A1–A6).

---

## 1. The order, in one breath

**De-hardcode the frontend and the two backend guards first, land that on `main` (invisible,
low-risk). Then fork a long-lived PUBG branch that is almost entirely _additive_. Defer the
URL restructure until there are actually two games to switch between, and multi-org until a
second organizer is real.**

```
Stage 1   Frontend F1+F2  +  backend (1,730) seam fixes          → merge to main  (invisible)
Stage 2   PUBG on a feature branch (forked AFTER Stage 1):
            2a backend PUBG domain      → merge to main early & often (all new files)
            2b frontend PUBG modules    → merge to main DORMANT (registered, no route yet)
          …CS feature work keeps shipping to main the whole time…
Stage 3   Frontend F4 (`/[game]` path) + F3 switcher              → activates PUBG, URLs change
Stage 4   Multi-org: frontend F6 + backend A1/A3 + reserved slugs → only when org #2 is real
```

---

## 2. Why this order: the registry seam is a merge firewall

This is the load-bearing rationale (and the reason "frontend first" is correct):

- The conflict-prone work is **editing shared CS files** (the three `FilterProvider`
  call sites, `season-utils.ts`, `SeasonForm.tsx`, the two `(1,730)` backend guards). If
  PUBG and ongoing CS work both edit these on divergent branches, you get the merge hell the
  user is worried about.
- So we get **all** of those edits onto `main` in **Stage 1**, _before_ the PUBG branch forks.
  After Stage 1, the registry (`GAME_CONFIG`/`GAME_VIEWS`) and context providers exist on
  `main`, and PUBG plugs into them by **appending a key and adding new leaf components** —
  not by editing CS code.
- Result: the PUBG branch's contact with shared files shrinks to "append a registry entry +
  add new migrations." CS work continues landing on `main` (new CS leaves, bugfixes) and
  **touches different files than PUBG adds**, so the eventual PUBG merge stays clean even
  after weeks of `main` churn.

This is the frontend analogue of the backend decision in the PUBG plan §5.1: _parallel PUBG
domain, not an overloaded `Matches` table._ The same logic that keeps PUBG out of the CS
schema keeps PUBG out of the CS components — and that isolation is what makes the branch
strategy work. **The moment a CS leaf component is edited to "also handle PUBG," the firewall
breaks** and every CS edit on `main` starts conflicting with the branch. New game = new leaf.

---

## 3. The stages

### Stage 0 — already merged (context)

Backend active-season refactor (MR !778 / `223a34c3`): both resolvers now take
`(organizer_id, app_id, gametype?)`; by-id endpoints require `season_id`. A PUBG season will
resolve through the _same_ resolver — `getOrganizerActiveOrLatestSeasonForAppId(1, 578080, 'squad')`
— with no new resolver code. This is what makes Stage 1 a continuation, not a fresh start.

### Stage 1 — land the seam on `main` (short-lived branches, invisible)

Frontend **F1 + F2** and the leftover backend `TODO(#220)` guards. No user-visible change;
URLs unchanged.

| Work                                                                                                                          | Files (verified locations)                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kill the 3× `<FilterProvider appId="730">`; feed `appId` from context                                                         | `app/(main)/(content-container)/layout.tsx:11`, `…/teams/[teamId]/TeamTabLayoutClient.tsx:19`, `…/players/[steamId]/PlayerTabLayoutClient.tsx:19` |
| `OrganizerProvider` / `GameProvider` defaulting to Kanaliiga/CS2                                                              | new `app/[…]`-level providers (no route change yet — provider defaults, not route params)                                                         |
| Capability config + view registry                                                                                             | new `lib/games/registry.ts` (`GAME_CONFIG`), `lib/games/views.ts` (`GAME_VIEWS`); move existing CS leaves behind it                               |
| Remove `CS2_GAME_ID = 1`, `DEFAULT_PLAYER_SEASON_CONTEXT {1,730,comp}`, `SeasonForm organizer_id:1` defaults → context-driven | `lib/season-utils.ts:3`, `lib/player-season-context.ts`, `components/dashboard/seasons/SeasonForm.tsx:104`                                        |
| Backend `/filters` guard + kana-elo: accept org/app/gametype params                                                           | `middlewares/cache-filtered-queries.ts:38`, `models/season-player-ranks.models.ts:182` (both carry `TODO(#220)`)                                  |

> **Done is when:** the app behaves identically, but the registry slot, the context providers,
> and parameterized read-guards all exist on `main`. This is also the **de-CS-ification audit**
> — lifting each component behind a capability is what reveals which components are shared
> chrome vs CS-only leaves (the user's open question). You can't know the split until you try.

### Stage 2 — PUBG on a long-lived feature branch (fork **after** Stage 1)

Two sub-tracks, both overwhelmingly additive. **Fork only after Stage 1 is on `main`** so the
branch starts from a tree where the shared-file edits are already done.

- **2a — Backend PUBG domain** (PUBG plan phases 0–4): spike, migrations (new `Pubg*` tables,
  `+'krafton'` platform enum, PUBG map rows, `MatchEvents` view), identity/signup reuse,
  rate-limited ingestion poller, scoring + standings. **~100% new files.** → **Merge to `main`
  early and often**; there is no CS overlap, so nothing justifies holding it on the branch.
- **2b — Frontend PUBG modules** (frontend **F5**): `PubgMatchDetail`, `PubgStandings`,
  `PubgSignupExtras`, plus the registry entries `GAME_VIEWS.pubg` / `GAME_CONFIG.pubg` and the
  game-conditional dashboard tools. → **Merge to `main` DORMANT**: registered but unreachable
  until Stage 3 wires the `/[game]` route. Shared-file contact = two appended registry keys.

> CS feature work ships to `main` normally throughout Stage 2. Because CS leaves ≠ PUBG leaves,
> the two streams edit disjoint files.

### Stage 3 — activate PUBG (`/[game]` path + switcher)

Frontend **F4**: introduce the `/[game]` segment, **301-redirect** flat routes
(`/seasons/123 → /cs2/seasons/123`), and have `[game]/layout.tsx` validate the segment against
**`OrganizerGames` ∩ registry** — 404 a game in the DB but not in the registry (org 1 is linked
to **four** games: CS2, PUBG, **Rocket League**, **Dota 2** — RL/Dota2 must not leak into the
switcher). Plus **F3** switcher. This flips the dormant PUBG modules on. The URL segment finally
earns its keep here — there are now two games to switch between.

### Stage 4 — multi-org (deferred; only when a 2nd organizer is real)

Frontend **F6** (`/[organizer]` path layer + reserved-slug denylist) + backend **A1**
(`Organizers.slug`/`primary_host`/`theme`) + **A3** (`organizer_id` on `AccountRoles` /
`AccountPermissionScopes`). Under the decided single-host model
(`multi-tenant-architecture.md` §3) this is a _path_ layer on `hub.kanaliiga.fi`, not host
middleware — that's the deferred upgrade.

---

## 4. The conflict surface (every file both streams touch)

| Shared file                                                  | Touched by                                            | How the ordering neutralizes it         |
| ------------------------------------------------------------ | ----------------------------------------------------- | --------------------------------------- |
| 3× FilterProvider, `season-utils.ts`, `SeasonForm.tsx`       | Stage 1 only                                          | done on `main` before PUBG forks        |
| `cache-filtered-queries.ts`, `season-player-ranks.models.ts` | Stage 1 only                                          | done on `main` before PUBG forks        |
| `lib/games/registry.ts` (`GAME_CONFIG`)                      | S1 creates (cs2); S2b appends `pubg`                  | append-only key → trivial/no conflict   |
| `lib/games/views.ts` (`GAME_VIEWS`)                          | same                                                  | same                                    |
| Dashboard tool list (capability-gated, §9)                   | S1/F2 makes it capability-driven; S2b adds PUBG tools | a capability map entry, not an `if`     |
| `Seasons.platform` enum / `Maps` rows / `MatchEvents` view   | S2a                                                   | new ALTER/CREATE migrations → additive  |
| CS leaf components (match detail, scoreboard, stats tables)  | CS work on `main` only                                | PUBG never edits them — separate leaves |

---

## 5. Rules of thumb (keep the firewall intact)

1. **Fork the PUBG branch only after Stage 1 is merged** — that's the whole point.
2. **Merge the PUBG _backend_ domain to `main` continuously** — all new files, zero CS overlap.
   Don't hoard it on the branch.
3. **Merge PUBG frontend modules dormant** (registered, no route) so the risky merge happens
   while the diff is small; flip them on with F4. Avoids one big-bang merge at the end.
4. **Rebase / merge `main` into the PUBG branch weekly.** A branch that diverges for months is
   the failure mode the registry seam is meant to prevent — don't reintroduce it by neglect.
5. **Never generalize a CS leaf to "also do PUBG."** New game = new leaf behind the registry.
   This is the single rule that keeps CS-on-`main` and PUBG-on-branch from colliding.
6. **Migrations:** both streams add timestamped Knex migrations; Knex tracks by filename so
   ordering is usually fine, but any PUBG migration that depends on a Stage-1 column must sort
   **after** it — keep PUBG timestamps strictly later and rebase so `knex_migrations` batch
   order stays sane.

---

## 6. Why not the alternatives

- **Why not URL-restructure first** (`hub.kanaliiga.fi/kanaliiga/cs2/…` before anything else)?
  Highest churn (every `<Link>`, 301s, bookmarks, SEO/canonical, sitemap, embed links), and
  with **one organizer and one live game it gates nothing** — `/kanaliiga/cs2/` is ceremony
  around URLs with no alternative to switch to. It's also the one shared surface (routing/links)
  that _would_ collide with ongoing CS route work. So it's Stage 3/4, not Stage 1. PUBG-under-
  Kanaliiga ships via F1–F5 with **zero** URL work.
- **Why not PUBG-first**? PUBG's frontend (F5) plugs into the registry from Stage 1; building
  PUBG views before the registry exists means building them against hardcodes you'll then have
  to unwind. Stage 1 is cheap and unblocks PUBG cleanly.
- **Why not one big PUBG merge at the end**? A long-lived branch + months of CS churn = merge
  pain. Rules 2–4 convert it into many small, low-conflict merges.

---

## 7. Doc-accuracy notes surfaced during verification (2026-06-04)

Carried here so they're not lost:

- ✅ **`pubg-implementation-plan.md` §2 — FIXED (2026-06-04).** `SteamPlayers.steam_id` is the
  **PRIMARY KEY (globally unique)**, not a "non-unique MUL index." The _conclusion_ (a player can
  be on a CS2 and a PUBG roster simultaneously) always held — per-season uniqueness lives in
  `SeasonTeamPlayers` — and §2 now states the correct evidence.
- ⚠️ **DB triggers — STILL OPEN (needs prod confirmation).** Both this plan and
  `multi-tenant-architecture.md` §5 lean on trigger-level enforcement as a guarantee, but the
  database the tooling connected to has **zero triggers** — re-confirmed 2026-06-04 against
  `information_schema.TRIGGERS` (empty for `kanaliiga`). The
  `20260326101000_fix_primary_triggers_discarded_at` migration is recorded as run and its source
  defines them season-scoped; composite FKs _are_ intact. Likely a dev dump/restore that dropped
  triggers — **someone must confirm production still has them**; if not, that's an integrity gap
  independent of PUBG, and the plan's "preserve the SQL-enforced CS2 guarantees" rationale is
  weaker than stated against any environment missing them.
