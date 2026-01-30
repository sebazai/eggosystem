---
name: Caster Application Form
overview: ""
todos:
  - id: "1"
    content: "Migration: add discord_guild_id to Organizers; backfill organizer_id 1 with 468873146787954689"
    status: completed
  - id: 1b
    content: "Migration: create CasterApplications table (organizer_id, account_id, caster_url, approved_terms_and_conditions, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, timestamps)"
    status: completed
  - id: 1c
    content: "Migration: add discord_caster_applications_channel_id and discord_caster_channel_id to Organizers; backfill organizer 1 (applications: 694834348893012018, caster channel: 612902579235586068)"
    status: completed
  - id: "2"
    content: "Backend: caster-applications models (create, get by account/organizer, get all, approve, reject, getPendingApplicationsCount, getOrganizersWithCasterApplications)"
    status: completed
  - id: 2a
    content: "Backend: Discord organizer service (client, getGuildById, assignCasterRoleInDiscord, notifyNewCasterApplicationInDiscord, notifyCasterApprovedInDiscord with approvedByAccountId, notifyCasterRejectedInDiscord with reason and rejectedByAccountId)"
    status: completed
  - id: 2b
    content: "Backend: Zod schemas for submit body and reject body (rejection_reason required); validation in controllers"
    status: completed
  - id: "3"
    content: "Backend: caster-applications controllers (submit with email-verified check, getMe, getByOrganizer, getAll, approve, reject with reason, getOrganizersWithCasterApplications)"
    status: completed
  - id: "4"
    content: "Backend: routes (organizers/:id/caster-applications, caster-applications/me, caster-applications, pending-count, approve, reject with body)"
    status: completed
  - id: "5"
    content: "Types: packages/types caster-applications (CasterApplication, submit body, reject body, response, OrganizerWithCasterApplications)"
    status: completed
  - id: "6"
    content: "Frontend: Zod form schema (caster-application-form-schema.ts) aligned with backend submit body"
    status: completed
  - id: "7"
    content: "Frontend: CasterApplicationForm (organizers list, prerequisites including email verified, rules, form per organizer, submit, post-submission states)"
    status: completed
  - id: "8"
    content: "Frontend: profile page integration (hasCasterAccess → CasterUrlSettings; else CasterApplicationForm with data)"
    status: completed
  - id: "9"
    content: "Frontend: API hooks (useOrganizersWithCasterApplications, useSubmitCasterApplication, useMyCasterApplications, useCasterApplications, useCasterApplicationsByOrganizer, usePendingCasterApplicationsCount)"
    status: completed
  - id: "10"
    content: "Dashboard: caster-applications page (WithRoleProtection, filter, table, empty/error/loading, approve/reject with confirm modal and reject-reason modal + toast + invalidate)"
    status: completed
  - id: "11"
    content: "Dashboard: CasterApplicationsTable component (columns, status badge pending/approved/rejected, reject with reason modal, actions, accessibility)"
    status: completed
  - id: "12"
    content: "Dashboard: sidebar menu item Caster Applications with pending count badge (route, roles, usePendingCasterApplicationsCount)"
    status: completed
  - id: 12a
    content: "Backend: pending count endpoint for dashboard; frontend usePendingCasterApplicationsCount + badge in DashboardAppSidebar"
    status: completed
  - id: "13"
    content: "Tests: backend models + controllers; frontend form + dashboard table; E2E apply → approve → role visible; rejection + re-apply"
    status: completed
  - id: 14
    content: "Notifications: approval email (short + Discord channel link); rejection email (reason); Discord on new application; Discord on approval (admin channel, include approved_by account_id); Discord on rejection (admin channel, reason + rejected_by account_id)"
    status: pending
isProject: false
---

# Caster Application Form Implementation Plan

## Overview

Users without the caster role can apply to become casters per organizer through a form on the profile page. The application requires Discord OAuth and Steam login, displays translated rules, collects a caster URL, and includes terms acceptance. Applications are stored at organizer level and require admin/helpdesk approval. Upon approval, users receive the caster role in the database and in that organizer's Discord server (using the organizer's `discord_guild_id`). This design supports multiple organizers, each with their own Discord server and caster application flow.

## Database Changes

### Migration 1: Add discord_guild_id to Organizers

**File**: `apps/backend/migrations/[timestamp]_add_organizer_discord_guild_id.ts`

- Add column `discord_guild_id` (string, nullable) to `Organizers`
- Backfill organizer_id 1 (Kanaliiga): set `discord_guild_id = '468873146787954689'`

### Migration 3: Add discord_caster_applications_channel_id and discord_caster_channel_id to Organizers

**File**: `apps/backend/migrations/[timestamp]_add_organizer_discord_caster_channels.ts`

- Add column `discord_caster_applications_channel_id` (string, nullable) to `Organizers` — admin channel where the bot posts "new application" and "application approved" messages.
- Add column `discord_caster_channel_id` (string, nullable) to `Organizers` — caster info channel; link is promoted in the approval email ("More info on this Discord channel: [link]"). Full URL is built as `https://discord.com/channels/{discord_guild_id}/{discord_caster_channel_id}`; storing channel_id is enough because we already have `discord_guild_id` on Organizers.
- Backfill organizer_id 1 (Kanaliiga):
  - `discord_caster_applications_channel_id = '694834348893012018'` (admin channel for new-application and approved notifications)
  - `discord_caster_channel_id = '612902579235586068'` (caster info channel; full link e.g. [https://discord.com/channels/468873146787954689/612902579235586068](https://discord.com/channels/468873146787954689/612902579235586068))

### Migration 2: Create CasterApplications Table (organizer-scoped)

**File**: `apps/backend/migrations/[timestamp]_create_caster_applications_table.ts`

Create a new table with:

- `id` (primary key, auto-increment)
- `organizer_id` (FK to Organizers, unsigned integer, not null)
- `account_id` (FK to Accounts, unsigned integer, not null)
- `caster_url` (string, nullable - URL for their streaming platform)
- `approved_terms_and_conditions` (boolean, not null, default false)
- `approved_by` (FK to Accounts, unsigned integer, nullable)
- `approved_at` (timestamp, nullable)
- `rejected_by` (FK to Accounts, unsigned integer, nullable)
- `rejected_at` (timestamp, nullable)
- `rejection_reason` (text, nullable) — shown to applicant and included in rejection email
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now)
- Unique constraint on `(account_id, organizer_id)` (one application per account per organizer). When an application is rejected, the user can re-apply: update the same row (clear rejected_by, rejected_at, rejection_reason; set new caster_url, approved_terms_and_conditions) so it becomes pending again.
- Index on `organizer_id`, `account_id`, and `approved_at` for query performance

### Future: Organizer-scoped permissions/roles (not implemented now)

The current schema is designed so we can add organizer-scoped permissions later without breaking caster applications:

- **Scope key**: `CasterApplications.organizer_id` (and any other organizer-scoped resource) naturally identifies "which organizer" an action belongs to. Future permission checks can use this (e.g. "user can approve this application iff user has global helpdesk/admin OR organizer-scoped helpdesk for `application.organizer_id`").
- **Possible DB extension** (for later):
  - Option A: New table `AccountOrganizerRoles(account_id, organizer_id, role_id)` with FK to Organizers. Global roles stay in `AccountRoles`; organizer-scoped roles live here. Permission logic: "has role X for organizer O" = row in AccountOrganizerRoles for (account, O, role X).
  - Option B: Add nullable `organizer_id` to `AccountRoles` and extend the primary key (e.g. `(account_id, role_id, game_id, organizer_id)` with organizer_id NULL meaning "global"). More invasive; Option A keeps existing behaviour unchanged.
- **No change now**: We do not add organizer roles or permission checks in this work. We only ensure resource shape and IDs (organizer_id in path/body) support that future.

## Backend Implementation

### Models

**File**: `apps/backend/src/models/caster-applications.models.ts`

Functions needed:

- `createCasterApplication(organizerId, accountId, casterUrl, approvedTerms)`: Create new application for organizer, or if account already has a rejected application for this organizer, update that row (clear rejected_by, rejected_at, rejection_reason; set new caster_url, approved_terms_and_conditions) so it becomes pending again (re-apply). If existing row is pending, fail (duplicate).
- `getCasterApplicationByAccountAndOrganizer(accountId, organizerId)`: Get application for user for one organizer
- `getCasterApplicationsByAccountId(accountId)`: Get all applications for user (for profile: list per organizer)
- `getAllCasterApplications(organizerId?)`: Get all applications for dashboard, optional filter by organizer_id (with account info, Discord username, Steam ID, organizer name)
- `approveCasterApplication(applicationId, approvedByAccountId)`: Approve application, assign caster role, assign Discord role in organizer's guild (using organizer.discord_guild_id)
- `rejectCasterApplication(applicationId, rejectedByAccountId, rejectionReason)`: Reject application (set rejected_by, rejected_at, rejection_reason). Rejection reason is required and shown to applicant.
- `getPendingApplicationsCount(organizerId?)`: Count pending applications (approved_at IS NULL AND rejected_at IS NULL), optional by organizer — used for sidebar badge
- `getOrganizersWithCasterApplications()`: Get organizers that have discord_guild_id set (for profile: which organizers support caster applications)

Use transactions when approving (create AccountRoles entry + update CasterApplications + assign Discord role in organizer's guild).

### Controllers

**File**: `apps/backend/src/controllers/caster-applications.controllers.ts`

- `submitCasterApplicationController`: Organizer from path `:organizer_id`. Body: `caster_url`, `approved_terms_and_conditions`. Validate user has Discord and Steam linked, create application for that organizer.
- `getMyCasterApplicationsController`: Get current user's applications (all organizers, or by optional `organizer_id` query).
- `getOrganizersWithCasterApplicationsController`: List organizers that support caster applications (have discord_guild_id).
- `getCasterApplicationsByOrganizerController`: List applications for one organizer (dashboard). Organizer from path `:organizer_id`. Later: check "user has helpdesk for this organizer".
- `getAllCasterApplicationsController`: Dashboard list all applications, optional query `organizer_id` to filter. Later: filter by organizers user has access to.
- `approveCasterApplicationController`: Approve by application id; resolve organizer from application. Later: check "user has helpdesk for application.organizer_id or global helpdesk".
- `rejectCasterApplicationController`: Reject application with body `rejection_reason` (required). Same permission as approve. Persist rejected state (rejected_by, rejected_at, rejection_reason); send **rejection email** to applicant with the reason; if organizer has `discord_caster_applications_channel_id` set, call `notifyCasterRejectedInDiscord(organizerId, discordUsername, rejectionReason, rejectedByAccountId)` to post to the admin channel. User can re-apply later (submit again updates the same row to pending).

Validation (see Backend validation / Zod below for schemas):

- Check organizer exists and has `discord_guild_id` set (for submission and for approval Discord step)
- **Check work email is verified** (e.g. `work_email_verified` or account-level verified flag) before allowing submit; return 400 with clear message if not verified.
- Check Discord is linked (via `getDiscordInfoByAccountId`)
- Check Steam is linked (via LinkedAccounts where provider='steam')
- Check user doesn't already have caster role (global caster role in DB)
- Check user doesn't have pending application for this organizer (if they have a rejected application for this organizer, allow re-apply: update the same row to pending with new caster_url and approved_terms)
- Validate request body with Zod (caster_url, approved_terms_and_conditions)

### Routes (REST shape for future organizer-scoped permissions)

Design principle: Put **organizer in the path** for organizer-scoped resources so that later we can add a single permission check: "user has access to organizer `:organizer_id`" (global admin/helpdesk OR organizer-scoped role for that organizer). No change to URLs when we add organizer permissions.

**File**: `apps/backend/src/routes/v1/organizer.routes.ts` (extend existing) or keep under a dedicated router:

- `GET /api/v1/organizers/with-caster-applications`: List organizers that support caster applications (have discord_guild_id). Later: optionally filter by "organizers the user has access to".
- `POST /api/v1/organizers/:organizer_id/caster-applications`: Submit application for that organizer (body: caster_url, approved_terms_and_conditions). Organizer in path; later: check "user can apply to this organizer".
- `GET /api/v1/organizers/:organizer_id/caster-applications`: List applications for that organizer (dashboard). Later: check "user has helpdesk for this organizer" (global or organizer-scoped).

**File**: `apps/backend/src/routes/v1/caster-applications.routes.ts` (user-scoped and global list):

- `GET /api/v1/caster-applications/me?organizer_id=`: Get current user's application(s) — all or for one organizer (authenticated). No organizer in path is fine (own data).
- `GET /api/v1/caster-applications?organizer_id=`: List all applications (dashboard), optional filter by organizer_id. Later: return only applications for organizers the user has access to.
- `GET /api/v1/caster-applications/pending-count?organizer_id=`: Pending applications count for sidebar badge (admin/helpdesk). Optional organizer_id filter.
- `POST /api/v1/caster-applications/:id/approve`: Approve by application id. Later: check "user has helpdesk for `application.organizer_id` or global helpdesk".
- `POST /api/v1/caster-applications/:id/reject`: Reject by application id; body: `rejection_reason` (required). Same permission as approve.

Summary:

| Purpose                             | Path                                                                                                     | Future permission (when we add organizer roles)                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| List organizers with caster apps    | `GET /organizers/with-caster-applications`                                                               | Optional: filter by organizers user can access                  |
| Submit application                  | `POST /organizers/:organizer_id/caster-applications`                                                     | Require "can apply to organizer" for `:organizer_id`            |
| List applications for one organizer | `GET /organizers/:organizer_id/caster-applications`                                                      | Require "helpdesk for organizer" for `:organizer_id`            |
| My applications                     | `GET /caster-applications/me`                                                                            | Own data only                                                   |
| List all (dashboard)                | `GET /caster-applications`                                                                               | Require "helpdesk for each application's organizer" (or global) |
| Pending count (sidebar)             | `GET /caster-applications/pending-count`                                                                 | Require admin/helpdesk                                          |
| Approve / Reject                    | `POST /caster-applications/:id/approve`, `POST /caster-applications/:id/reject` (body: rejection_reason) | Require "helpdesk for application.organizer_id" or global       |

Add dashboard routes under `apps/backend/src/routes/v1/dashboard/index.ts` if caster applications are mounted there (e.g. `/dashboard/caster-applications` as a prefix); public/organizer routes stay under `/api/v1/organizers` and `/api/v1/caster-applications`.

### Discord Integration (organizer-scoped)

**File**: `apps/backend/src/services/discord-organizer.services.ts` (new file)

Use a single bot that can be invited to multiple organizer Discord servers. Guild ID comes from **Organizers.discord_guild_id**, not from env.

- `DISCORD_KANALIIGA_BOT_TOKEN` (or generic `DISCORD_ORGANIZER_BOT_TOKEN`): Bot token — one bot can be in multiple guilds

Functions needed:

- `initializeOrganizerDiscordClient()`: Initialize Discord client using the bot token (similar pattern to existing `initializeDiscordClient`)
- `getOrganizerDiscordClient()`: Get or initialize client
- `getGuildById(guildId: string)`: Get guild by ID (from organizer.discord_guild_id)
- `assignCasterRoleInDiscord(guildId: string, discordUserId: string)`: Find or create "caster" role in that guild and assign it to the user
  - Fetch guild by guildId (from Organizers.discord_guild_id)
  - Fetch guild member by Discord user ID
  - Find existing "caster" role in guild, or create it if it doesn't exist
  - Assign role to member using `member.roles.add()`
  - Handle errors gracefully (user not in server, bot not in guild, permissions, etc.)
- `notifyNewCasterApplicationInDiscord(organizerId: number)`: After creating a caster application, if organizer has `discord_caster_applications_channel_id` set, post a message to that channel (e.g. "New caster application from [Discord username] for [Organizer name]. Review: [dashboard link]."). Use same bot/client as assignCasterRoleInDiscord. Log errors without failing the submit flow.
- `notifyCasterApprovedInDiscord(organizerId: number, discordUsername: string, approvedByAccountId: number)`: After approving a caster application, if organizer has `discord_caster_applications_channel_id` set, post a message to that channel (e.g. "Caster application approved: [Discord username] is now a caster. Approved by account_id [approvedByAccountId]."). For now only account_id is shown (helpdesk/admins are not required to have Discord linked). Same admin channel as new-application notifications. Log errors without failing the approval flow.
- `notifyCasterRejectedInDiscord(organizerId: number, discordUsername: string, rejectionReason: string, rejectedByAccountId: number)`: After rejecting a caster application, if organizer has `discord_caster_applications_channel_id` set, post a message to that channel (e.g. "Caster application rejected: [Discord username]. Reason: [rejection_reason]. Rejected by account_id [rejectedByAccountId]."). Same admin channel. Log errors without failing the reject flow.

**Integration in submit flow**:

When `createCasterApplication` succeeds: if organizer has `discord_caster_applications_channel_id` set, call `notifyNewCasterApplicationInDiscord(organizerId)` to post a message to that channel (e.g. "New caster application from [Discord username] for [Organizer name]. Review: [dashboard URL]."). Run after commit; log errors without failing the submit.

**Integration in approval flow**:

When `approveCasterApplication` is called:

1. Load application with organizer (get organizer.discord_guild_id)
2. If organizer.discord_guild_id is null, skip Discord step (or fail approval if you require it)
3. Start database transaction
4. Create AccountRoles entry for caster role
5. Update CasterApplications (set approved_by, approved_at)
6. Commit transaction
7. Get Discord user ID from account; call `assignCasterRoleInDiscord(organizer.discord_guild_id, discordUserId)` (outside transaction, log errors only)
8. If Discord assignment fails, log error but don't fail the approval (role is in database)
9. If organizer has `discord_caster_applications_channel_id` set, call `notifyCasterApprovedInDiscord(organizerId, discordUsername, approvedByAccountId)` to post a message to the admin channel (e.g. "Caster application approved: [Discord username] is now a caster. Approved by account_id [X]."). Log errors without failing the request.
10. Send **approval email** to applicant (account work email): **short and nice** — e.g. "Your caster application has been approved. More info on this Discord channel: [link]." Link is `https://discord.com/channels/{organizer.discord_guild_id}/{organizer.discord_caster_channel_id}` (build from Organizers; if `discord_caster_channel_id` is not set, omit the "more info" sentence or use a generic placeholder). Use existing email queue/worker pattern; send after commit; log failures without failing the request.

**Environment Variables**:

- `DISCORD_KANALIIGA_BOT_TOKEN` (or `DISCORD_ORGANIZER_BOT_TOKEN`): Bot token for the organizer Discord bot(s). Same bot can be invited to multiple organizer servers; guild ID is read from Organizers.discord_guild_id per organizer.

**Organizers table**:

- `discord_guild_id`: Guild ID; required for caster applications and Discord role assignment on approval.
- `discord_caster_applications_channel_id`: Admin channel — bot posts "new application", "application approved" (with approved_by account_id), and "application rejected" (with rejection reason and rejected_by account_id) messages here (e.g. backfill organizer 1: `694834348893012018`).
- `discord_caster_channel_id`: Caster info channel — link promoted in approval email; full URL = `https://discord.com/channels/{discord_guild_id}/{discord_caster_channel_id}` (e.g. backfill organizer 1: `612902579235586068`). Storing channel_id is enough.

**Note**: The bot should have the following permissions in each organizer server:

- `MANAGE_ROLES` - To assign roles to members
- `VIEW_CHANNELS` - To access guild information
- The bot's role should be positioned above the "caster" role in the role hierarchy

### Backend validation (Zod)

**File**: `apps/backend/src/controllers/caster-applications.controllers.ts` (or `apps/backend/src/schemas/caster-applications.schemas.ts`)

- **Submit body schema** (used in `submitCasterApplicationController`):
  - `caster_url`: `z.string().url().min(1)` — optional in DB but required for submit; allow empty string to mean "not set" if needed, or require URL.
  - `approved_terms_and_conditions`: `z.literal(true)` — must be true to submit (reject false/undefined).
- Parse with `.parse(req.body)` or `.safeParse()`; on failure return 400 with RFC 7807 / validation error payload consistent with existing API.
- **Approve**: No body schema (or empty body). Id from path; validate `id` is positive integer.
- **Reject body schema**: `rejection_reason`: `z.string().min(1, 'Rejection reason is required')` — required so applicant receives a clear reason by email and in-app.

Shared types can live in `packages/types` and Zod schemas in backend (or shared in a shared package if both frontend and backend use the same schema).

### Type Definitions

**File**: `packages/types/src/caster-applications/` (new directory)

- `CasterApplication.interface.ts`: Application entity (id, organizer_id, account_id, caster_url, approved_terms_and_conditions, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at, updated_at)
- `CasterApplicationSubmitBody.interface.ts` or inline: Request payload for submission (`caster_url`, `approved_terms_and_conditions`)
- `CasterApplicationRejectBody.interface.ts` or inline: Request payload for reject (`rejection_reason`, required)
- `CasterApplicationResponse.interface.ts`: Single application + optional organizer name, Discord username, Steam ID for dashboard list
- `OrganizerWithCasterApplications.interface.ts`: Organizer id, name, (discord_guild_id, discord_caster_channel_id optional in response if needed for building approval-email link on backend) for "organizers with caster applications" list

## Frontend Implementation

### Form: Zod types and schema (frontend)

**File**: `apps/frontend/src/components/profile/caster-application-form-schema.ts` (or colocated in same folder)

- **Form schema** (Zod, used with react-hook-form + zodResolver):
  - `caster_url`: `z.string().url('Please enter a valid URL').min(1, 'Stream URL is required')` — align with backend.
  - `approved_terms_and_conditions`: `z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to apply.' }) })`.
- Export type: `type CasterApplicationFormValues = z.infer<typeof casterApplicationFormSchema>`.
- Keep in sync with backend submit body so client and server validation match.

### Form Component (CasterApplicationForm)

**File**: `apps/frontend/src/components/profile/CasterApplicationForm.tsx`

- **Data dependencies**: `useOrganizersWithCasterApplications()`, `useMyCasterApplications()` (no organizer filter to get all), `user` from AuthContext (for discordLinked, provider_id for Steam), and **email verified** state (e.g. from account details or `useEmailsVerified`).
- **Organizer context**: For each organizer with caster applications, show a section. If only one organizer (e.g. Kanaliiga), can show single form without selector.
- **Pre-requisites** (all required before showing the apply form): (1) **Email verified** — if work email is not verified, show "Verify your email to apply" and do not show the form (reuse existing verify-email UX). (2) Discord linked (reuse `DiscordSettings`-style link button + status text). (3) Steam: user already logged in via Steam so `user.provider_id` present. If not linked Discord: show "Link Discord" and do not show form for that organizer until linked.
- **Rules section**: Static content (translated EN strings) with headings: Who can stream, Where to stream, Appropriate content, Language usage, Logos. Use existing typography and card/section components.
- **Form (per organizer)**:
  - `react-hook-form` with `zodResolver(casterApplicationFormSchema)`, defaultValues: `{ caster_url: '', approved_terms_and_conditions: false }`.
  - Fields: Input for caster URL (type url, placeholder e.g. [https://twitch.tv/…](https://twitch.tv/…)), Checkbox for terms ("I have read the above information and promise to follow them" / "I accept the terms").
  - Submit button: disabled when `!formState.isValid` or `isSubmitting` or when user already has pending/approved application for this organizer. On submit: call `submitMutation.mutateAsync({ organizerId, values })` (mutation uses `POST /organizers/:organizer_id/caster-applications` with body from values).
  - Loading: disable form and show loading state on submit. On success: toast success, invalidate `useMyCasterApplications`; on error: toast error, show field/API errors if any.
- **Post-submission state (per organizer)**:
  - If status `pending`: Message "Your application is under review. Please open a ticket in Kanaliiga Discord #open_servicerequest if requested." (or generic per organizer).
  - If `approved`: Message "You are approved as a caster. You can now set your default stream URL below." (and profile will show CasterUrlSettings once role is present). Applicant also receives a short approval email: "Approved. More info on this Discord channel: [link]."
  - If `rejected`: Show rejection message: display `rejection_reason` and "You may re-apply if you wish." Applicant also receives an email with the reason. Show the same form again below the message so user can re-apply; on submit, backend updates the same row (clears rejected, sets new caster_url and terms) so it becomes pending.
- **Edge cases**: Already has caster role → do not show form; show CasterUrlSettings. Email not verified → do not show form; show "Verify your email to apply." Multiple organizers: show one block per organizer with its own form or status.

### Profile Page Integration

**File**: `apps/frontend/src/app/(main)/(content-container)/profile/page.tsx`

- If `hasCasterAccess(user)`: render only `CasterUrlSettings` (existing).
- Else: render a wrapper that fetches organizers with caster applications + my applications; then render `CasterApplicationForm` (or a list of organizer sections with form/status). Pass `user`, `checkAuth` if needed for Discord link refresh.

### Dashboard: Caster approvals page (end-to-end)

**Page**: `apps/frontend/src/app/(admin)/dashboard/caster-applications/page.tsx`

- **Layout**: `WithRoleProtection allowedRoles={["admin", "helpdesk"]}`. Title e.g. "Caster applications", short description.
- **Data**: Fetch organizers (for filter dropdown) and applications. Use `useCasterApplications(organizerId?)` with optional organizer filter from state; or `useCasterApplicationsByOrganizer(organizerId)` when "one organizer" is selected. Optionally `useOrganizersWithCasterApplications()` or a small organizers list for filter.
- **Filter**: Dropdown "All organizers" / "Kanaliiga" / … (organizer_id). Filter is client or server (query param `organizer_id` on `GET /caster-applications`).
- **Table**: `CasterApplicationsTable` with columns: Organizer name, Account ID (or nickname), Discord username, Steam ID, Caster URL, Submitted date, Status (pending/approved/rejected), Actions.
- **Empty state**: When no applications or no applications for selected filter: message "No caster applications" / "No applications for this organizer."
- **Error state**: If query errors, show error message and retry option.
- **Actions**: Approve button, Reject button. On Approve: optional confirmation modal ("Approve this application? The user will receive the caster role and an email with casting info.") → call `POST /caster-applications/:id/approve` → toast success / error → invalidate queries. On Reject: confirmation modal with required **rejection reason** text field → call `POST /caster-applications/:id/reject` (or `DELETE` with body) with `rejection_reason` → applicant receives email with reason; toast → invalidate. Sidebar shows **pending count** (e.g. "Caster Applications (3)") via `usePendingCasterApplicationsCount()` and badge in [DashboardAppSidebar](apps/frontend/src/components/dashboard/DashboardAppSidebar.tsx).
- **Loading**: Skeleton or spinner while applications load. Disable actions while mutation in flight.

**Component**: `apps/frontend/src/components/dashboard/caster-applications/CasterApplicationsTable.tsx`

- Props: `applications`, `organizerFilter`, `onOrganizerFilterChange`, `onApprove`, `onReject`, `isApproving`, `isRejecting` (or use mutations inside with application id).
- Table: Use existing table patterns (e.g. shadcn Table). Sort by created_at desc by default. Status badge (pending = yellow, approved = green, rejected = red/gray). Reject action: open modal with required rejection reason text field; submit POST /reject with body. Buttons per row or dropdown actions.
- Accessibility: Labels, loading states, and error announcements.

### API Client Hooks

**File**: `apps/frontend/src/hooks/data/useCasterApplication.ts`

- `useOrganizersWithCasterApplications()`: Query for organizers that support caster applications (`GET /organizers/with-caster-applications`)
- `useSubmitCasterApplication(organizerId)`: Mutation for submitting — calls `POST /organizers/:organizer_id/caster-applications` (organizer in path)
- `useMyCasterApplications(organizerId?)`: Query for user's application(s) (`GET /caster-applications/me?organizer_id=`)
- `useCasterApplicationsByOrganizer(organizerId)`: Query for dashboard list for one organizer (`GET /organizers/:organizer_id/caster-applications`)
- `useCasterApplications(organizerId?)`: Query for dashboard list all (`GET /caster-applications?organizer_id=`)
- `usePendingCasterApplicationsCount(organizerId?)`: Query for pending count for sidebar badge (`GET /caster-applications/pending-count?organizer_id=` or equivalent)

### Dashboard Sidebar

**File**: `apps/frontend/src/components/dashboard/DashboardAppSidebar.tsx`

Add new menu item:

- "Caster Applications" under appropriate section (or new "Applications" section)
- Route: `/dashboard/caster-applications`
- Required roles: `["admin", "helpdesk"]`

## Translation

The Finnish rules need to be translated to English and displayed in the form:

1. **Who can stream**: "Suitable for everyone. Whether you're a veteran or just interested in the topic. However, we try to avoid streaming the same match by different people so that streamers don't have to compete for viewers. However, matches can be streamed in multiple languages simultaneously. If necessary, Kanaliiga will choose the streamer."
2. **Where to stream**: "You can freely choose your platform and channel."
3. **Appropriate content**: "The content of the stream must comply with Finnish laws and be appropriate. Even though the audience is probably older, keep in mind that younger family members may also follow their parents playing in Kanaliiga!"
4. **Language usage**: "Remember that you always represent your employer when playing in Kanaliiga and making broadcasts. Consider this in all your behavior, including during games. POV streams are also watched afterwards by several players playing in the same series, so all the emotional boiling that happened in the heat of the game is visible to more players playing in Kanaliiga and may not give the best picture of the company, team or at worst the entire Kanaliiga you represent. Of course, humor in good taste is allowed and desirable, but don't test the limits!"
5. **Logos**: "The broadcast must have the Kanaliiga logo visible and possibly other logos defined by Kanaliiga. Information about these will be updated to the Kanaliiga CS-Casters channel."

## Flow Diagram

```
User visits profile page
  ↓
Check if user has caster role?
  ├─ Yes → Show CasterUrlSettings (existing)
  └─ No → Check application status
      ├─ Has pending application → Show pending message + Discord ticket reminder
      ├─ Has approved application → Should have role (edge case)
      └─ No application → Show CasterApplicationForm
          ↓
      Check email verified?
      ├─ No → Show "Verify your email to apply"
      └─ Yes → Check Discord & Steam linked?
          ├─ Not linked → Show linking instructions
          └─ Both linked → Show form
          ↓
      User fills form (URL + accepts terms)
          ↓
      Submit application
          ↓
      Show success + Discord ticket reminder (Discord channel notified if organizer has channel id; sidebar count updates for admins)
          ↓
      Admin/Helpdesk reviews in dashboard (sees pending count in sidebar)
          ↓
      Admin approves
          ↓
      User gets caster role in database (AccountRoles)
          ↓
      User gets caster role in Discord (organizer's guild via Organizers.discord_guild_id)
          ↓
      Approval email sent to applicant (short: approved; more info on Discord channel [link]). Message posted to admin channel: "Caster [username] approved."
          ↓
      User can now see CasterUrlSettings
```

Rejection path: Admin rejects with reason → rejection email to applicant with reason; Discord message to admin channel (rejection reason + rejected_by account_id) → applicant sees rejection message on profile + "You may re-apply if you wish." → user can submit again (same row updated to pending).

## End-to-end flow (Solution Architect view)

| Layer        | Apply (user)                                                                                                                                                                                                      | View status (user)                                                                                    | List (admin)                                                                                                                 | Approve (admin)                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **DB**       | Insert row in CasterApplications (organizer_id, account_id, caster_url, approved_terms_and_conditions).                                                                                                           | Read CasterApplications by account_id (and optional organizer_id).                                    | Read CasterApplications (+ join Organizers, account/Discord/Steam info), filter by organizer_id.                             | Update CasterApplications (approved_by, approved_at); insert AccountRoles (caster); call Discord service.                                       |
| **Backend**  | POST body validated with Zod (caster_url, approved_terms_and_conditions); check organizer exists + has discord_guild_id; check Discord/Steam linked, no existing application, no caster role; create application. | GET /caster-applications/me?organizer_id=; return list of applications.                               | GET /caster-applications?organizer_id= or GET /organizers/:id/caster-applications; return list with organizer/Discord/Steam. | POST /caster-applications/:id/approve; load application + organizer; transaction (AccountRoles + CasterApplications); then assign Discord role. |
| **Frontend** | CasterApplicationForm: organizers list → pick organizer → form (URL + terms) → submit mutation → toast + invalidate.                                                                                              | Same form/section: useMyCasterApplications() → show status per organizer (pending/approved/rejected). | Dashboard page: useCasterApplications(organizerId?) → CasterApplicationsTable with filter.                                   | Table row: Approve → confirm modal → approve mutation → toast + invalidate.                                                                     |
| **Types**    | Submit body: CasterApplicationSubmitBody (frontend Zod aligns with backend Zod). Response: application + status.                                                                                                  | My applications: array of CasterApplication (or DTO with organizer name, status).                     | Dashboard list: CasterApplication + organizer name, discord_username, steam_id.                                              | Approve: no body; response success/error.                                                                                                       |

**Data flow summary**

1. **Apply**: Frontend form (Zod) → POST /organizers/:organizer_id/caster-applications (body Zod-validated on backend) → model createCasterApplication or updateRejectedToPending (if existing row is rejected) → DB insert or update. Then notify Discord channel if organizer has discord_caster_applications_channel_id.
2. **View status**: GET /caster-applications/me → model getCasterApplicationsByAccountId → frontend shows status per organizer.
3. **List (dashboard)**: GET /caster-applications?organizer_id= → model getAllCasterApplications → table with filter.
4. **Approve**: POST /caster-applications/:id/approve → model approveCasterApplication (transaction + Discord + approval email) → frontend invalidates list and shows updated row.
5. **Reject**: POST /caster-applications/:id/reject (body: rejection_reason) → model rejectCasterApplication (rejected_by, rejected_at, rejection_reason) + rejection email + Discord message to admin channel (reason + rejected_by account_id) → frontend invalidates list and sidebar count.

## Testing Considerations

- Unit tests for models (create, get, approve, reject, re-apply from rejected, getOrganizersWithCasterApplications, getPendingApplicationsCount)
- Backend: Zod validation tests (submit body accepted/rejected; invalid URL, terms false; reject body rejection_reason required)
- Integration tests for controllers (submit rejected when email not verified; submit, getMe, getAll, approve, reject with reason; auth and validation; re-apply after reject)
- Frontend: CasterApplicationForm (render, validation errors, submit success/error, post-submission states including rejected + re-apply)
- Frontend: CasterApplicationsTable (render, filter, approve/reject with reason modal, loading/empty/error); sidebar badge (pending count)
- E2E: apply (form fill + submit) → dashboard list shows pending → Discord channel message (if configured) → approve → user receives email and has caster role / CasterUrlSettings visible; reject with reason → user sees rejection message and receives email → re-apply
- Test role assignment on approval (both database and Discord)
- Test Discord role assignment service (mock Discord client; assignCasterRoleInDiscord)
- Test error handling when Discord assignment fails (approval still succeeds)
- Test that caster role is created in Discord if it doesn't exist
- Align frontend form Zod schema with backend submit body schema (same rules so client/server validation match)

## Communication and notifications

This section records who is informed, when, and what is left for later. The codebase already has email (nodemailer, BullMQ for welcome/schedule-change) and toasts; no new channel is required for the recommendations below.

### Who is informed (decided)

| Event                        | User (applicant)                                                                                                                                                                                                                                                                                     | Admin / helpdesk                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User submits application** | In-app: success toast + status text on profile ("Under review" + Discord ticket reminder).                                                                                                                                                                                                           | **Discord**: Message posted to organizer's `discord_caster_applications_channel_id` (e.g. "New caster application from [Discord username] for [Organizer]. Review: [dashboard link]."). **Sidebar**: Pending count badge (e.g. "Caster Applications (3)") so they see there are applications to review. |
| **Admin approves**           | **Email**: Short approval email to work email: "Your caster application has been approved. More info on this Discord channel: [link]." Link = `https://discord.com/channels/{guild_id}/{discord_caster_channel_id}` from organizer. In-app: on next visit, "You are approved" and CasterUrlSettings. | **Discord**: Message posted to admin channel: e.g. "Caster application approved: [Discord username] is now a caster. Approved by account_id [X]." In-app: success toast after Approve; table refetches; sidebar count updates.                                                                          |
| **Admin rejects**            | **Email**: Sent to account work email with the **rejection reason**. In-app: on next visit, rejection message (reason) + "You may re-apply if you wish." Re-apply: user can submit again; backend updates the same row to pending.                                                                   | **Discord**: Message posted to admin channel with rejection reason and rejected_by account_id (e.g. "Caster application rejected: [Discord username]. Reason: [reason]. Rejected by account_id [X]."). In-app: toast after Reject; table refetches; sidebar count updates.                              |

### Implementation notes

- **Sidebar count**: Backend exposes `GET /caster-applications/pending-count?organizer_id=`. Frontend: `usePendingCasterApplicationsCount()`; [DashboardAppSidebar](apps/frontend/src/components/dashboard/DashboardAppSidebar.tsx) shows badge next to "Caster Applications" (e.g. "Caster Applications (3)" or just "(3)").
- **Organizer Discord channel**: Organizers table has `discord_caster_applications_channel_id`. After `createCasterApplication` succeeds, if set, call `notifyNewCasterApplicationInDiscord(organizerId)` (same bot as role assignment). Message format: include applicant Discord username, organizer name, link to dashboard caster-applications page. Log errors without failing submit.
- **Approval email**: After approval (DB + Discord role), send **short** email to applicant work email: e.g. "Your caster application has been approved. More info on this Discord channel: [link]." Link built from organizer: `https://discord.com/channels/{organizer.discord_guild_id}/{organizer.discord_caster_channel_id}`. Storing `discord_caster_channel_id` on Organizers is enough (we already have discord_guild_id). Use existing email queue/worker; send after commit; log failures without failing the request.
- **Admin channel on approval**: After approval, if organizer has `discord_caster_applications_channel_id` set, post message to that channel (e.g. "Caster application approved: [Discord username] is now a caster. Approved by account_id [X].") via `notifyCasterApprovedInDiscord(organizerId, discordUsername, approvedByAccountId)`. For now only account_id is shown (helpdesk/admins are not required to have Discord linked).
- **Admin channel on rejection**: After reject (DB update), if organizer has `discord_caster_applications_channel_id` set, post message to that channel (e.g. "Caster application rejected: [Discord username]. Reason: [rejection_reason]. Rejected by account_id [X].") via `notifyCasterRejectedInDiscord(organizerId, discordUsername, rejectionReason, rejectedByAccountId)`.
- **Rejection email**: After reject (DB update), send email to applicant work email including the `rejection_reason`. Same queue/worker pattern.
- **Rejection and re-apply**: Rejection persists rejected*by, rejected_at, rejection_reason. User can re-apply: submit again; backend updates the same row (clear rejected*, set new caster_url, approved_terms_and_conditions) so it becomes pending. No delete; one row per (account_id, organizer_id).

### Other ideas (optional, not in initial scope)

- **Confirmation email on submit**: Send applicant a short "We received your caster application" email when they submit, so they have a record and know it wasn't lost. Low effort; can add later if desired.
- **Require rejection reason in UI**: Already decided (required body `rejection_reason`). Consider character minimum (e.g. 10 chars) so reason is meaningful.
- **Sort dashboard by oldest first**: Default sort by created_at asc for pending applications so admins tackle oldest first; or add a "Sort by date" toggle.

### Out of scope

- Discord DM to applicant (would require bot DM permissions and consent).
- In-app notification center or push notifications.

## Notes

- The caster URL collected in the application can be used to pre-populate the `AccountCasterUrls` table after approval, or users can set it via the existing `CasterUrlSettings` component
- Approval email: short; send to applicant work email — "Approved. More info on this Discord channel: [link]." (link from organizer.discord_guild_id + organizer.discord_caster_channel_id). Rejection email: send with rejection_reason. Use existing email queue/worker. Organizer caster channel link: store discord_caster_channel_id on Organizers; full URL = [https://discord.com/channels/{guild_id}/{channel_id}](https://discord.com/channels/{guild_id}/{channel_id}).
- The Discord ticket reminder is informational only - actual ticket creation is manual
- Rejection: persist rejected_by, rejected_at, rejection_reason; show rejection message to applicant; send email with reason. User can re-apply (submit again updates the same row to pending).
- Discord guild ID is stored per organizer (`Organizers.discord_guild_id`), so multiple organizers can each have their own Discord server and caster flow
- One bot token (`DISCORD_KANALIIGA_BOT_TOKEN` or `DISCORD_ORGANIZER_BOT_TOKEN`) is used; the same bot can be in multiple guilds — guild ID is taken from the organizer when approving
- If Discord role assignment fails (e.g., user not in server, bot not in that guild, permissions), the approval still succeeds in the database - errors are logged but don't block the approval process
- The caster role should be created in Discord if it doesn't exist, or found if it already exists
- AccountRoles caster role is global (one caster role in DB per account); Discord role is per-organizer server. If you need per-organizer caster role in DB later, that would be a separate extension (e.g. scope by organizer or game).
- **Organizer-scoped permissions (future)**: REST is designed with organizer in path for organizer-scoped resources (`POST/GET /organizers/:organizer_id/caster-applications`) so that when we add organizer-scoped roles (e.g. `AccountOrganizerRoles`), we can enforce "access to this organizer" in one place without changing URLs.
