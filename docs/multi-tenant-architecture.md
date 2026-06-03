# Multi-Tenant Platform Architecture — Tenancy, Deployment & Auth

> **Status:** Design proposal (not yet implemented). Companion to
> [`frontend-multi-tenant.md`](frontend-multi-tenant.md) (IA, routing, providers) and
> [`pubg-implementation-plan.md`](pubg-implementation-plan.md) (the first second-game).
>
> **Naming placeholders** (umbrella brand not decided): `{platform-name}` = the umbrella
> product, `{apex-domain}` = its apex domain, `{org}` = an organizer slug. Concrete tenant
> examples use **Kanaliiga**, **Pappaliiga**, **Suomiliiga**.

---

## 1. Goal

Turn the current single-organizer (Kanaliiga) system into a platform that hosts **multiple
organizers, each running multiple games**, where each organizer is a branded tenant. The
guiding constraints:

- **Adding an organizer = a config row + theme + DNS**, not a new environment.
- **One identity per player across all tenants** (a person plays Kanaliiga CS2 _and_
  Pappaliiga PUBG with one login).
- **Reuse the existing RS256 JWT auth** — evolve where it's issued and scoped, don't replace it.

---

## 2. Tenancy model: pooled single-instance

**One backend, one frontend, one database — shared by all tenants.** The tenant is resolved
**at runtime from the `Host` header**; data is scoped by `organizer_id`. This is _pooled_
(single-instance) multi-tenancy, **not** a deployment per organizer.

```
              *.{apex-domain}   +   vanity hosts (kanaliiga.fi, pappaliiga.fi …)
                                │   (all hostnames point at the same app)
                        ┌───────▼────────┐
                        │  reverse proxy │  passes Host through; terminates TLS
                        └───────┬────────┘
           ┌────────────────────┼────────────────────┐
    ┌──────▼──────┐      ┌───────▼───────┐     ┌───────▼───────┐
    │  Next.js    │      │  Express API  │     │   MariaDB     │
    │ (1 deploy,  │─────▶│ (1 deploy,    │────▶│ (1 DB; rows   │
    │  N replicas)│      │  N replicas)  │     │  scoped by    │
    │ middleware  │      │ organizer_id  │     │  organizer_id)│
    │ → tenant    │      │ scoping       │     │               │
    └─────────────┘      └───────────────┘     └───────────────┘
        central auth issuer (one origin) signs RS256 JWT — see §6
```

> "One deployment" ≠ "one container." Each tier still scales horizontally (N replicas behind
> the load balancer). That's _scaling_, not per-tenant siloing.

### Why pooled (and not per-tenant deployments)

Isolated per-tenant deployments would **break the features we want**:

- **Shared identity** — `SteamPlayers`/`Teams` are cross-tenant; one canonical player
  profile aggregating across orgs/games is impossible if each tenant has its own DB.
- **Central SSO** — "log in once, roam across leagues" needs one identity store.
- **The umbrella hub** — a cross-tenant organizer directory and player search needs one DB.
- **Cheap onboarding** — "add an organizer = a row + theme + DNS" only holds if a tenant is
  _data_, not an environment to provision, migrate, deploy, and monitor.

The codebase is already built this way: the embed calendar takes `organizer_id` + `app_id`
against one API, `Seasons` carries `organizer_id`, and there is one `docker-compose.prod.yml`.

### What is per-tenant vs shared

| Per tenant (config/data)                                      | Shared (one of)               |
| ------------------------------------------------------------- | ----------------------------- |
| A row in `Organizers` (`slug`, `primary_host`, theme)         | Backend deployment            |
| DNS record (`{slug}.{apex-domain}`, or vanity `kanaliiga.fi`) | Frontend deployment           |
| TLS cert (wildcard covers subdomains; vanity needs its own)   | Database                      |
| `OrganizerGames` rows (which games it runs)                   | Auth issuer / player identity |
| Theme assets (logo, colors)                                   | Player & team records         |

### When to reconsider (the silo model)

Move a tenant to its own deployment **only** if it contractually requires data
isolation/residency, or for a heavyweight white-label enterprise tier where blast-radius
isolation justifies N pipelines. For a handful of Finnish leagues under one umbrella, pooled
is correct — and because the code is identical either way, a demanding tenant can be
extracted into a silo later without an architecture change.

---

## 3. URL & host scheme

### Decided deployment model (day one): single host, path-based

> **Decision (2026-06): launch on a single origin — `hub.kanaliiga.fi` — with tenancy and
> game carried in the path: `hub.kanaliiga.fi/{organizer}/{game}/{resource}`. All SSO happens
> on this one host.** The subdomain + vanity-domain scheme in the rest of §3 (and §6.2, §9) is
> the **preserved upgrade path, deferred — not day-one work.**

**Why it's the easiest route _and_ already true:**

- **It's the deployed topology.** `FRONTEND_URL` and `BACKEND_URL` are the same origin in every
  environment (`docker-compose.prod.yml` → `https://${HUB_PUBLIC_URL}`; Next served at `/`,
  Express at `/api/*`). Path-prefix routing under one host is already exercised by the
  on-demand env (`BASE_PATH=/${ENV_ID}`, `next.config.ts` `basePath`, backend `getPath()`).
- **SSO is free.** One origin → the host-only, `sameSite:strict` cookie (`auth.services.ts`)
  rides every request, and the Steam realm/returnURL (`configs/passport.ts`) is a single
  `BACKEND_URL`. One login authenticates every `{organizer}/{game}` path with **zero new auth
  code**. The `domain=.{apex}` cookie change and the vanity one-time-code handoff (§6.2) are
  **not needed** until a real host upgrade exists.

**What we still do now, so the upgrade to subdomains/vanity stays cheap (door stays open):**

- **Resolve the tenant from the `[organizer]` path segment — host-agnostic.** Never assume the
  host _is_ the tenant. A branded host added later then feeds the _same_ `[organizer]`
  resolution (additive, not a rewrite).
- **Authorization stays organizer-scoped server-side** (§7) — unchanged by the host choice;
  this is the real work either way.
- **Reserved-slug list.** On one host the root namespace is shared between hub routes
  (the existing top-level segments under `src/app/(main)/(content-container)/` — `/players`,
  `/teams`, `/seasons`, `/matches`, `/organizers`, `/profile`, … — plus `/api` and the
  `(admin)`/`(embed)`/`(health)` groups) and tenant slugs (`/[organizer]`). Enforce a denylist
  at organizer creation so a slug can never shadow a hub route. (Subdomains sidestep this;
  paths don't.)

_Accepted trade-off:_ tenant URLs read `hub.kanaliiga.fi/pappaliiga/…` — a Kanaliiga-branded
host for every org. **Explicitly accepted for now**; a neutral apex domain + per-brand hosts
are the documented upgrade below, not a launch blocker.

---

The scheme below is the **upgrade target** (organizer-by-host), preserved for when a brand
graduates off the shared host.

Public shape (full rationale in `frontend-multi-tenant.md` §4): **organizer by host, game by
path.**

```
{organizer-host}/{game}/{resource}
   default:  kanaliiga.{apex-domain}/cs2/seasons/12
   upgraded: kanaliiga.fi/cs2/seasons/12         ← vanity domain
   hub/path: {apex-domain}/kanaliiga/cs2/seasons/12
```

Both branded host and hub path **rewrite to one internal route** `/[organizer]/[game]/…`.

### The vanity upgrade ("remove the {apex-domain}")

A tenant upgrades from `kanaliiga.{apex-domain}` to `kanaliiga.fi`. Note these are
**different origins** (different registrable domains). The **app code does not change** —
both hosts resolve to the same internal route; the host→organizer lookup just gains a
`primary_host` entry. Three infra consequences (see §6 for the auth one):

1. **Cookies/session** — a shared `.{apex-domain}` cookie does **not** reach `kanaliiga.fi`.
   → handled by the central-SSO handoff (§6).
2. **TLS** — subdomains are covered by one `*.{apex-domain}` wildcard cert; a vanity domain
   needs its own managed cert.
3. **Redirects/canonical** — keep `kanaliiga.{apex-domain}` alive but `301 → kanaliiga.fi`,
   set the canonical tag, update the sitemap, so links/SEO don't fragment.

So a vanity upgrade is a **DNS + cert + one DB row** operation, not a redeploy.

---

## 4. Tenant resolution

```
Request Host ──▶ middleware ──▶ resolve organizer ──▶ rewrite to /[organizer]/…
                                  │
                                  ├─ match Organizers.primary_host  (vanity, e.g. kanaliiga.fi)
                                  ├─ else {slug}.{apex-domain}        (default subdomain)
                                  └─ else apex {apex-domain}          → hub (no tenant)
```

- Resolution is a **cached** lookup (host → organizer id/slug); cold lookups hit the DB,
  warm ones hit an in-memory/Redis cache.
- On the backend, the resolved `organizer_id` is attached to the request context (header
  from the edge, or re-resolved) and **every tenant-scoped query filters on it**.

### `Organizers` schema deltas

Today `Organizers` has `name`, `faceit_id`, and Discord fields — but **no slug and no host
mapping**. Add:

```sql
ALTER TABLE Organizers
  ADD COLUMN slug         VARCHAR(64)  NOT NULL UNIQUE,   -- 'kanaliiga','pappaliiga','suomiliiga'
  ADD COLUMN primary_host VARCHAR(255) NULL UNIQUE,       -- 'kanaliiga.fi'; NULL = use {slug}.{apex-domain}
  ADD COLUMN theme        JSON NULL;                      -- logo url, colors, etc.
```

> For many vanity domains later, graduate `primary_host` into an `OrganizerDomains` table
> (host → organizer, with a canonical flag). One column covers the first few brands.

---

## 5. Data isolation — the obligation pooled tenancy creates

Pooled tenancy trades deployment isolation for **row-level isolation by `organizer_id`**.
This must be enforced, not assumed:

- **Every tenant-scoped query filters on the resolved `organizer_id`.** `Seasons` already
  carries it; matches/teams/registrations reach it via `season_id`.
- **Authorization is organizer-scoped** (§7): a Pappaliiga admin cannot mutate Kanaliiga
  data even though both live in one DB.
- **Backstop in the schema where it matters.** This project already enforces invariants in
  the DB (composite FKs, triggers — see the database README). The same philosophy applies:
  critical cross-tenant boundaries (e.g. permission scopes) should be constrained at the DB
  layer, not trusted to app code alone.
- **Cross-tenant entities are explicit, not accidental.** `SteamPlayers` and `Teams` are
  _intentionally_ shared (§8). Everything else is tenant-scoped by default.

---

## 6. Authentication — central SSO from day one (decided)

**Decision:** keep the existing **RS256 JWT** mechanism unchanged in format; **centralize
where it's issued**, and scope the cookie per host strategy. Authentication is **global**;
authorization is **per-tenant** (§7).

> **Under the day-one single-host model (§3), most of §6 is already satisfied.** Issuance is
> _already_ central (one origin), the host-only cookie already gives SSO across every
> `{organizer}/{game}` path, and the Steam realm is already a single `BACKEND_URL`. So the
> `domain=.{apex}` cookie change (§6.2 subdomain case) and the vanity one-time-code handoff
> (§6.2 vanity case, §9) are **deferred until the first subdomain/vanity host exists** — build
> them with that upgrade, not now. The RS256 verify-anywhere property (§6.1) is what keeps that
> later addition cheap.

### 6.1 What exists today (grounded in `services/auth.services.ts`)

- Steam OpenID → **RS256-signed** access token + refresh token (`jti` for rotation/revocation).
- Cookies: `httpOnly`, `secure` (prod), `sameSite: "strict"`, refresh path-scoped to
  `/api/v1/auth/refresh`.
- **No `domain` attribute** → cookies are currently **host-only** (bound to the exact host).

Key insight: **RS256 is asymmetric**, so any tenant host can _verify_ a token with the
public key alone — no shared secret, no shared session store. The hard part of SSO is
already solved; the choice is only _where issuance happens_ and _how the cookie is scoped_.

### 6.2 Target: one central issuer, same JWT, two cookie strategies

Centralize **token issuance** on one origin (e.g. `accounts.{apex-domain}`, or
`{apex-domain}/api/v1/auth`) that owns the Steam OpenID dance and signs the existing RS256
JWT. Token format, keys, and `authenticateJWT` are unchanged. Then:

- **Subdomain tenants (common case) → shared cookie.** Set the access-token cookie with
  `domain: .{apex-domain}`. One login, and the cookie rides along to
  `kanaliiga.{apex-domain}`, `pappaliiga.{apex-domain}`, etc. **automatically.** Real SSO for
  the price of one cookie attribute.
- **Vanity domains (`kanaliiga.fi`) → one-time token handoff.** A different registrable
  domain can't share the `.{apex-domain}` cookie, so on first visit the vanity host bounces
  to central auth, which redirects back with a **short-lived one-time code**
  (`kanaliiga.fi/auth/callback?code=…`); the vanity host's backend exchanges it and sets its
  **own** host-only cookie. Because the JWT is RS256, `kanaliiga.fi` verifies it with the
  public key — no shared secret needed. Build this handoff **once**; every future vanity
  upgrade is then pure DNS + cert with **zero auth rework**.

```
                       ┌─────────────────────────────┐
   login (Steam) ─────▶│ central issuer               │ signs RS256 JWT
                       │ accounts.{apex-domain}        │
                       └───────────┬──────────────────┘
            subdomain case         │          vanity case
   set cookie domain=.{apex}       │   302 → kanaliiga.fi/auth/callback?code=…
   ┌───────────────────────────┐   │   ┌──────────────────────────────────────┐
   │ kanaliiga.{apex}   ✓ session│  │   │ kanaliiga.fi backend exchanges code,  │
   │ pappaliiga.{apex}  ✓ session│  │   │ verifies JWT w/ public key,           │
   │ (one .{apex} cookie)        │  │   │ sets its OWN host-only cookie          │
   └───────────────────────────┘   │   └──────────────────────────────────────┘
```

### 6.3 Concrete changes to today's code

1. **Add a configurable cookie `domain`.** Cookies are host-only today; set
   `domain: process.env.COOKIE_DOMAIN` (`.{apex-domain}` in prod, unset/localhost in dev) to
   enable subdomain roaming. This single change unlocks the common case.
2. **`sameSite` nuance.** `sameSite: "strict"` is fine for the access token (subdomains are
   the same registrable site; the vanity handoff carries a code in the URL, not a cross-site
   cookie). But the central-auth **redirect** flow must not depend on a strict cookie — use
   `sameSite: "lax"` on whatever cookie participates in the login redirect, or strict will
   silently drop the top-level navigation cookie.
3. **Refresh location.** With a `.{apex-domain}` cookie, the refresh endpoint at the apex
   serves all subdomains. Vanity hosts refresh against their own backend (which holds the
   keys). The central issuer owns the `jti` revocation list.

### 6.4 Why not the alternatives

- **"Shared cookie now, SSO later"** — the only delta to do it right from day one is the
  `domain` attribute + centralizing the login endpoint (hours, not weeks). Deferring means
  retrofitting across N live host-only-cookie tenants. RS256 already removes the hardest part
  of SSO, so there's no reason to take the debt.
- **Per-tenant login** — discards the SSO the crypto already enables; players re-auth per
  league for no benefit.

---

## 7. Authorization — global identity, per-tenant permissions

> **Authentication is global; authorization is per-tenant.**

The JWT proves **who the player is** (Steam identity) and must **not** encode an organizer —
identity is cross-tenant. **What they may do** is resolved per-request from `AccountRoles` /
`AccountPermissionScopes` against the organizer of the current host. So one token works
everywhere; a Pappaliiga admin is a normal viewer on Kanaliiga.

This means roles/permissions need an **organizer dimension** (today everything is implicitly
organizer 1):

```sql
-- illustrative; align with existing PK/index shapes during implementation
ALTER TABLE AccountRoles            ADD COLUMN organizer_id INT UNSIGNED NULL;  -- NULL = platform-global (e.g. superadmin)
ALTER TABLE AccountPermissionScopes ADD COLUMN organizer_id INT UNSIGNED NULL;
-- + FKs to Organizers, + organizer_id folded into uniqueness/scoping where roles are season/team scoped
```

- A role/permission with `organizer_id = NULL` is **platform-global** (e.g. a platform
  superadmin); a non-null value scopes it to one tenant.
- The captain triggers already key on `(season_id, team_id)`; since seasons belong to an
  organizer, captain scoping is implicitly tenant-correct. The work is on **admin/staff**
  roles that today assume a single organizer.

This is the real auth-related schema work — bigger than the token change, which is just
cookie scoping + one handoff endpoint.

---

## 8. Cross-tenant identity (players & teams)

`SteamPlayers` and `Teams` are **deliberately shared** across all organizers and games:

- One person, one Steam identity, one login — playing in many leagues and games.
- **Canonical player profile** lives at the **hub** (`{apex-domain}/players/[steamId]`),
  aggregating across orgs/games; tenant-scoped pages show a slice and link to it.
- A `Teams` row has no `game_id` or `organizer_id`, so the _same_ team could in principle
  register across organizers/games — a registration/product choice, not a schema constraint
  (see PUBG plan's `SeasonTeamPlayers` note).

This shared-identity layer is precisely what makes per-tenant deployments a non-starter (§2).

---

## 9. Vanity-domain upgrade runbook

When a tenant upgrades `{slug}.{apex-domain}` → `{vanity}`:

1. Point DNS for `{vanity}` at the platform reverse proxy.
2. Provision a TLS cert for `{vanity}` (managed/Let's Encrypt).
3. Set `Organizers.primary_host = '{vanity}'` (one row update).
4. `301` `{slug}.{apex-domain}` → `{vanity}`; set canonical + sitemap host.
5. Confirm the auth handoff (§6.2) issues a cookie on `{vanity}` — no token/format change.

No redeploy, no code change.

---

## 10. Migration / phasing (from today's single-tenant system)

Pairs with the frontend phasing (`frontend-multi-tenant.md` §11). Backend/platform order:

| Phase                                | Deliverable                                                                                                                                                               | Risk                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **A1. Organizer config**             | Add `Organizers.slug` / `primary_host` / `theme`; seed Kanaliiga; keep everything resolving to org 1.                                                                     | Low (additive)       |
| **A2. Central auth issuer**          | Move Steam OpenID + token issuance to one origin; add `COOKIE_DOMAIN`; set cookie `domain: .{apex-domain}`; `sameSite` fix on the login redirect. Token format unchanged. | Medium (auth path)   |
| **A3. Organizer dimension on authz** | `organizer_id` on `AccountRoles` / `AccountPermissionScopes`; backfill org 1; scope admin queries.                                                                        | Medium (permissions) |
| **A4. Host tenant resolution**       | Edge middleware host→organizer; attach `organizer_id` to request context; enforce `organizer_id` filtering on tenant-scoped queries.                                      | Medium               |
| **A5. Vanity handoff**               | One-time-code exchange endpoint + `/auth/callback` on tenant hosts. Build once.                                                                                           | Medium               |
| **A6. Hub surface**                  | Apex organizer directory + canonical cross-tenant player profile.                                                                                                         | Low                  |

> A1–A2 are safe to do **before** a second organizer exists (Kanaliiga is org 1 throughout),
> which means the SSO foundation is in place by the time PUBG-under-Kanaliiga ships. A3–A4
> land with the first real second organizer. A5 lands with the first vanity upgrade.

> **Under the day-one single-host model (§3):** A2 reduces to "centralize login on the one
> origin" (no `COOKIE_DOMAIN` — there is only one host); A4 reduces to reading the
> `[organizer]` **path** segment (no host→organizer middleware); **A5 is dropped** until a
> vanity host is requested. The load-bearing day-one work is **A1** (organizer config) +
> **A3** (organizer-scoped authz) + the **reserved-slug rule** (§3).

---

## 11. Open questions

- **Umbrella brand & apex domain** — placeholders until decided; gates hub routing, cookie
  `domain`, and the central-auth origin name.
- **Superadmin model** — confirm `organizer_id = NULL` = platform-global is the intended
  representation for cross-tenant staff.
- **Auth issuer hosting** — dedicated `accounts.{apex-domain}` origin vs. issuing from the
  apex app; affects cookie/redirect topology.
- **Per-tenant data export / deletion** (GDPR) — pooled DB needs tenant-scoped export and
  erasure tooling; confirm requirements.
- **Embed auth** — embeds are currently anonymous/param-based; confirm they stay unauthenticated
  under multi-tenancy (no cookie crossing into partner sites).
