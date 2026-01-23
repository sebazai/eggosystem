---
name: Caster Application Form
overview: Implement a caster application form on the profile page where users without caster role can apply. The form requires Discord OAuth and Steam login, displays translated rules, collects caster URL, and includes terms acceptance. Applications are stored in a new CasterApplications table and require admin/helpdesk approval via dashboard. Upon approval, users receive the caster role and can then manage their caster URL.
todos:
  - id: "1"
    content: Create database migration for CasterApplications table
    status: pending
  - id: "2"
    content: Create backend models for caster applications (create, get, approve, list)
    status: pending
  - id: "2a"
    content: Create Discord Kanaliiga service for role assignment (initialize client, assign caster role)
    status: pending
  - id: "3"
    content: Create backend controllers for caster application endpoints (integrate Discord role assignment on approval)
    status: pending
  - id: "4"
    content: Create backend routes for caster applications API
    status: pending
  - id: "5"
    content: Create TypeScript type definitions for caster applications
    status: pending
  - id: "6"
    content: Create frontend CasterApplicationForm component with rules, URL input, and terms checkbox
    status: pending
  - id: "7"
    content: Integrate CasterApplicationForm into profile page (show when user lacks caster role)
    status: pending
  - id: "8"
    content: Create dashboard page for viewing and approving caster applications
    status: pending
  - id: "9"
    content: Create dashboard table component for listing applications with approve/reject actions
    status: pending
  - id: "10"
    content: Add caster applications menu item to dashboard sidebar
    status: pending
  - id: "11"
    content: Create API client hooks for caster application operations
    status: pending
  - id: "12"
    content: "Test complete flow: application submission → approval → role assignment (DB + Discord) → URL management"
    status: pending
isProject: false
---

# Caster Application Form Implementation Plan

## Overview

Users without the caster role can apply to become casters through a form on the profile page. The application requires Discord OAuth and Steam login, displays translated rules, collects a caster URL, and includes terms acceptance. Applications are stored and require admin/helpdesk approval. Upon approval, users receive the caster role.

## Database Changes

### Migration: Create CasterApplications Table

**File**: `apps/backend/migrations/[timestamp]_create_caster_applications_table.ts`

Create a new table with:

- `id` (primary key, auto-increment)
- `account_id` (FK to Accounts, unsigned integer, not null)
- `caster_url` (string, nullable - URL for their streaming platform)
- `approved_terms_and_conditions` (boolean, not null, default false)
- `approved_by` (FK to Accounts, unsigned integer, nullable)
- `approved_at` (timestamp, nullable)
- `created_at` (timestamp, default now)
- `updated_at` (timestamp, default now)
- Unique constraint on `account_id` (one application per account)
- Index on `account_id` and `approved_at` for query performance

## Backend Implementation

### Models

**File**: `apps/backend/src/models/caster-applications.models.ts`

Functions needed:

- `createCasterApplication(accountId, casterUrl, approvedTerms)`: Create new application
- `getCasterApplicationByAccountId(accountId)`: Get application for user
- `getAllCasterApplications()`: Get all applications for dashboard (with account info, Discord username, Steam ID)
- `approveCasterApplication(applicationId, approvedByAccountId)`: Approve application and assign caster role
- `rejectCasterApplication(applicationId, approvedByAccountId)`: Reject application (optional - may just delete)
- `getPendingApplicationsCount()`: Count pending applications for dashboard

Use transactions when approving (create AccountRoles entry + update CasterApplications + assign Discord role).

### Controllers

**File**: `apps/backend/src/controllers/caster-applications.controllers.ts`

- `submitCasterApplicationController`: Validate user has Discord and Steam linked, create application
- `getMyCasterApplicationController`: Get current user's application status
- `getAllCasterApplicationsController`: Dashboard endpoint (admin/helpdesk only)
- `approveCasterApplicationController`: Approve application, assign caster role (both in database and Discord)
- `rejectCasterApplicationController`: Reject/delete application (optional)

Validation:

- Check Discord is linked (via `getDiscordInfoByAccountId`)
- Check Steam is linked (via LinkedAccounts where provider='steam')
- Check user doesn't already have caster role
- Check user doesn't have pending application
- Validate caster URL format (zod URL validation)

### Routes

**File**: `apps/backend/src/routes/v1/caster-applications.routes.ts`

- `POST /api/v1/caster-applications`: Submit application (authenticated)
- `GET /api/v1/caster-applications/me`: Get user's application (authenticated)
- `GET /api/v1/caster-applications`: List all (admin/helpdesk only)
- `POST /api/v1/caster-applications/:id/approve`: Approve (admin/helpdesk only)
- `DELETE /api/v1/caster-applications/:id`: Reject/delete (admin/helpdesk only)

Add to `apps/backend/src/routes/v1/dashboard/index.ts` if needed for dashboard routes.

### Discord Integration

**File**: `apps/backend/src/services/discord-kanaliiga.services.ts` (new file)

Create a separate Discord client for Kanaliiga server using:

- `DISCORD_KANALIIGA_BOT_TOKEN`: Bot token for Kanaliiga Discord server
- `DISCORD_KANALIIGA_GUILD_ID`: Guild ID for Kanaliiga Discord server

Functions needed:

- `initializeKanaliigaDiscordClient()`: Initialize Discord client for Kanaliiga server (similar pattern to existing `initializeDiscordClient`)
- `getKanaliigaDiscordClient()`: Get or initialize Kanaliiga Discord client
- `getKanaliigaDiscordGuild()`: Get Kanaliiga Discord guild
- `assignCasterRoleInDiscord(discordUserId)`: Find or create "caster" role in Kanaliiga server and assign it to the user
  - Get Discord user ID from `getDiscordInfoByAccountId`
  - Fetch guild member by Discord user ID
  - Find existing "caster" role in guild, or create it if it doesn't exist
  - Assign role to member using `member.roles.add()`
  - Handle errors gracefully (user not in server, bot permissions, etc.)

**Integration in approval flow**:

When `approveCasterApplication` is called:

1. Start database transaction
2. Create AccountRoles entry for caster role
3. Update CasterApplications (set approved_by, approved_at)
4. Get Discord user ID from account
5. Assign caster role in Discord (outside transaction, but log errors)
6. Commit transaction
7. If Discord assignment fails, log error but don't fail the approval (role is in database)

**Environment Variables**:

Add to `.env.example` and docker-compose files:

- `DISCORD_KANALIIGA_BOT_TOKEN`: Bot token for Kanaliiga Discord bot
- `DISCORD_KANALIIGA_GUILD_ID`: Guild ID for Kanaliiga Discord server

**Note**: The Kanaliiga Discord bot should have the following permissions:

- `MANAGE_ROLES` - To assign roles to members
- `VIEW_CHANNELS` - To access guild information
- The bot's role should be positioned above the "caster" role in the role hierarchy

### Type Definitions

**File**: `packages/types/src/caster-applications/` (new directory)

- `CasterApplication.interface.ts`: Application data structure
- `CasterApplicationRequest.interface.ts`: Request payload for submission
- `CasterApplicationResponse.interface.ts`: Response types

## Frontend Implementation

### Form Component

**File**: `apps/frontend/src/components/profile/CasterApplicationForm.tsx`

Component structure:

1. **Pre-requisites check section**:
   - Show Discord linking status (use existing `DiscordSettings` pattern)
   - Show Steam login status (check if user has `provider_id` from Steam)
   - Only show form when both are linked

2. **Rules section**:
   - Display translated rules (from user requirements):
     - Who can stream
     - Where to stream
     - Appropriate content
     - Language usage
     - Logos
   - Format as readable sections with headings

3. **Application form**:
   - Caster URL input (URL validation)
   - Terms checkbox: "I have read the above information and promise to follow them" - "I accept the terms"
   - Submit button (disabled until all requirements met)

4. **Post-submission state**:
   - Show application status (pending/approved/rejected)
   - If pending: Show message about opening Discord ticket in #open_servicerequest
   - If approved: Show success message (user now has caster role, can manage URLs)
   - If rejected: Show rejection message (optional - may just allow re-application)

### Profile Page Integration

**File**: `apps/frontend/src/app/(main)/(content-container)/profile/page.tsx`

Logic:

- If user has caster role: Show `CasterUrlSettings` (existing)
- If user doesn't have caster role: Show `CasterApplicationForm`
- Check application status and show appropriate state

### Dashboard Approval Page

**File**: `apps/frontend/src/app/(admin)/dashboard/caster-applications/page.tsx`

Similar pattern to `apps/frontend/src/app/(admin)/dashboard/registration/approval/page.tsx`:

- List all pending applications in a table
- Show: Account ID, Discord username, Steam ID, Caster URL, Submitted date
- Actions: Approve button, Reject button (optional)
- After approval, user gets caster role automatically

**Component**: `apps/frontend/src/components/dashboard/caster-applications/CasterApplicationsTable.tsx`

- Table with applications
- Approve/Reject actions
- Status indicators

### API Client Hooks

**File**: `apps/frontend/src/hooks/data/useCasterApplication.ts`

- `useSubmitCasterApplication()`: Mutation for submitting
- `useMyCasterApplication()`: Query for user's application
- `useCasterApplications()`: Query for dashboard (admin/helpdesk)

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
      Check Discord & Steam linked?
      ├─ Not linked → Show linking instructions
      └─ Both linked → Show form
          ↓
      User fills form (URL + accepts terms)
          ↓
      Submit application
          ↓
      Show success + Discord ticket reminder
          ↓
      Admin/Helpdesk reviews in dashboard
          ↓
      Admin approves
          ↓
      User gets caster role in database (AccountRoles)
          ↓
      User gets caster role in Discord (Kanaliiga server)
          ↓
      User can now see CasterUrlSettings
```

## Testing Considerations

- Unit tests for models (create, get, approve)
- Integration tests for controllers
- E2E test for form submission flow
- Test role assignment on approval (both database and Discord)
- Test validation (Discord/Steam linking, URL format, terms acceptance)
- Test Discord role assignment service (mock Discord client)
- Test error handling when Discord assignment fails (should not fail approval)
- Test that caster role is created in Discord if it doesn't exist

## Notes

- The caster URL collected in the application can be used to pre-populate the `AccountCasterUrls` table after approval, or users can set it via the existing `CasterUrlSettings` component
- Consider adding email notification when application is approved (future enhancement)
- The Discord ticket reminder is informational only - actual ticket creation is manual
- Rejection functionality is optional - may just allow users to re-apply by deleting old application
- Discord role assignment uses a separate bot (`DISCORD_KANALIIGA_BOT_TOKEN`) from the main Discord integration (`DISCORD_BOT_TOKEN`)
- If Discord role assignment fails (e.g., user not in server, bot permissions), the approval still succeeds in the database - errors are logged but don't block the approval process
- The caster role should be created in Discord if it doesn't exist, or found if it already exists
