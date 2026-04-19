# Fantasy League - Implementation Guide (PoC)

> **Note (audited 2026-04-19):** This is a historical record of the PoC rollout. The feature is now shipped, so code paths, file names, and API shapes listed below may have moved. For current structure, grep `apps/backend/src/**/*fantasy*` and `apps/frontend/src/components/fantasy/` + `apps/frontend/src/hooks/data/fantasy/`.

## What Was Created

### 1. Design Documentation

- **File:** `docs/fantasy-league.md`
- Complete design specification including:
  - Core features and game flow
  - Player valuation system
  - Points calculation
  - Database schema
  - API endpoints (future)
  - UI/UX specifications

### 2. Frontend Implementation

#### Routes

- **Main Page:** `apps/frontend/src/app/(main)/(content-container)/seasons/[season]/fantasy/page.tsx`
  - **URL:** `/seasons/{seasonId}/fantasy`
  - Draft new team or view existing team
- **Leaderboard Page:** `apps/frontend/src/app/(main)/(content-container)/seasons/[season]/fantasy/leaderboard/page.tsx`
  - **URL:** `/seasons/{seasonId}/fantasy/leaderboard`
  - View top 50 fantasy teams and your ranking
- **Price History Page:** `apps/frontend/src/app/(main)/(content-container)/seasons/[season]/fantasy/price-history/page.tsx`
  - **URL:** `/seasons/{seasonId}/fantasy/price-history`
  - Track player price changes over time
- Accessible via the season navigation menu dropdown under "Fantasy League"

#### Components

**Main Component:**

- `src/components/fantasy/FantasyLeague.tsx`
  - Main container for fantasy league
  - **Two modes:**
    1. **Draft Mode:** Select and finalize new team
       - League selection
       - Budget management ($1,000,000)
       - Player filtering (by tier: bronze/silver/gold)
       - Player sorting (by value, name, rating)
       - Team composition tracking (5 players)
       - Team name input and validation
       - Team finalization with API integration
    2. **Team View Mode:** View and manage existing team
       - Display team name, stats, and rankings
       - Show rank as "X / Y" (user rank / total teams in division)
       - Show all 5 selected players with roles
       - Player substitution interface
       - Budget tracking
       - Quick links to leaderboard and top players
       - Role assignment and swapping with weekly limits
  - Fetches real data from backend APIs
  - Authentication-aware (shows login prompt if needed)

**Data Hooks:**

- `src/hooks/data/useSeasonLeagues.tsx`
  - Fetches available leagues for a season
  - Used for league selection dropdown
- `src/hooks/data/useFantasyPlayers.tsx`
  - Fetches all players for a specific league with stats
  - Returns player ratings, K/D, ADR, headshot %, etc.
- `src/hooks/data/useMyFantasyTeam.tsx`
  - Fetches authenticated user's existing fantasy team
  - Returns team details, players, roles, and stats

**Sub-Components:**

- `src/components/fantasy/FantasyPlayerFlipCard.tsx`
  - Flippable trading card design with modern esports aesthetic
  - **Smooth rounded corners** (16px border-radius) for polished look
  - **Gradient borders** (gold/silver/bronze) with glowing effects
  - **Front side:**
    - Player photo with tier-colored gradient overlay
    - Team logo with gradient frame
    - Rounded tier badge
    - Rounded player name banner with shine effects
    - Quick stats (Rating, K/D, Kills) with tier-colored highlights
    - Value display with glow effect
    - Rounded collectible-style button
  - **Back side:**
    - Detailed season statistics
    - Main stats (Rating, K/D) in large display
    - Secondary stats (Kills, Deaths) color-coded
    - Additional stats (HS%, KAST, Flash Assists, FK/FD, ADR T/CT) in 2-column vertical layout
    - Value on top, label below for consistency
    - Rounded action button
  - Hover to flip on desktop, touch to flip on mobile
  - Team logos displayed with gradient frames
- `src/components/fantasy/SelectedTeamPanel.tsx`
  - Shows selected team in horizontal row (5 slots)
  - Trading card style with smooth rounded corners
  - Team name input with validation (3-30 characters)
  - Budget tracking and finalize button
  - Real-time form validation and error display
- `src/components/fantasy/SubstitutionDialog.tsx`
  - Modal dialog for player substitutions
  - Search and filter available players
  - Budget impact visualization
  - Substitution confirmation with validation
  - Team logos with gradient frames
  - Colored borders and gradients matching tier
  - Budget tracker in header
  - Role assignment dropdown for each player
  - Player removal functionality
  - "Finalize Team" button (active when 5 players selected)

#### Navigation

- Fantasy link added to season menu in `Navigation.tsx`
- Appears alongside Standings, Calendar, Captains, Faceit Links

## Mock Data

The PoC includes mock data for demonstration:

- 3 mock divisions (Master, Challenger, Elite)
- 15 mock players from 3 teams:
  - FaZe Clan (5 players)
  - Legacy (5 players)
  - Mibu Wolves (5 players)
- Player tiers distributed across bronze, silver, gold
- Player values ranging from $142k to $320k

## Features Implemented

### ✅ Completed

- [x] League selection dropdown (fetches real leagues from backend)
- [x] Real player data from database with stats (kana_rating, K/D, ADR)
- [x] Backend API endpoint: `/api/v1/seasons/{season_id}/fantasy/leagues/{league_id}/players`
- [x] Players grouped by team with horizontal scrolling
- [x] Flippable trading card design (click to flip)
- [x] Player cards with stats display (front: quick stats, back: detailed stats)
- [x] Dynamic tier calculation based on kana_rating (Bronze/Silver/Gold) - data-driven thresholds
- [x] Dynamic player value calculation based on rating, tier, K/D, and kill volume
- [x] Team logos on player cards
- [x] Budget tracking and validation ($1,000,000)
- [x] Player selection (max 5)
- [x] Budget constraint enforcement
- [x] Selected team panel with 5 slots (horizontal layout)
- [x] Premium metallic trading card aesthetic with smooth rounded corners
- [x] Role assignment for each player
- [x] Role uniqueness constraint (one role per player)
- [x] Player removal from team
- [x] Finalize team button (enabled when 5 players + within budget)
- [x] Responsive design (mobile & desktop)
- [x] Filter by tier
- [x] Sort by rating/value/name
- [x] Click to flip cards (both desktop & mobile)
- [x] Team name input with validation (3-30 characters)
- [x] Team creation API integration
- [x] Existing team view/management
- [x] Player substitution UI with dialog
- [x] Leaderboard page with top 50 teams
- [x] Price history page
- [x] Navigation menu integration
- [x] Backend: Fantasy team CRUD endpoints
- [x] Backend: Initial player value seeding endpoint
- [x] Backend: Points calculation service
- [x] Backend: Database migrations for all fantasy tables
- [x] Backend: Instant price updates after each match (replaces weekly job)
- [x] Backend: Value calculation priority fix (incremental updates)
- [x] Frontend: Rank display (X / Y format) using leaderboard data
- [x] Frontend: Card stats layout improvements (2-column vertical layout for last 4 stats)

### 🚧 Not Yet Implemented

- [ ] Player photos (currently using placeholder)
- [ ] Admin interface for managing fantasy seasons
- [ ] Email notifications for price changes
- [ ] Push notifications for match start/end
- [ ] Advanced analytics and insights
- [ ] Mobile app integration
- [ ] Fantasy league rewards/prizes system

### ✅ Recent Fixes & Improvements

- [x] **Value Calculation Priority Fix**: Fixed bug where snapshot value was prioritized over current value, causing incorrect incremental updates. Now correctly prioritizes `FantasyPlayerValues` for incremental updates.
- [x] **Rank Display**: Fixed rank display to show "X / Y" format (user rank / total teams in division) using `steam_id` from team data.
- [x] **Card Stats Layout**: Improved last 4 stats (Flash Assists, FK/FD, ADR T, ADR CT) to use 2-column vertical layout with value on top and label below, matching the style of top stats.
- [x] **Instant Price Updates**: Changed from weekly price updates to instant updates after each match for better responsiveness.
- [x] **Value Change Cap**: Implemented ±10% cap per match to prevent excessive value swings.

## How to Test

1. **Start the development server:**

   ```bash
   cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm dev
   ```

2. **Navigate to the page:**
   - Go to the home page
   - Click on the season menu (e.g., "Season 16")
   - Click on "Fantasy" in the dropdown

3. **Test the flow (Draft Mode):**
   - **Login first** (fantasy requires authentication)
   - Select a league from the dropdown
   - Notice players are now grouped by team with horizontal scrolling
   - **Click on a player card** to flip and see detailed stats
   - Notice the premium trading card design with smooth rounded corners
   - Add players to your team (max 5, within $1,000,000 budget)
   - Selected team appears at the top in a horizontal row
   - Try to add a 6th player (should be disabled)
   - Try to exceed budget (should show "Can't Afford")
   - Assign unique roles to each player (18 different roles available)
   - Try assigning the same role to multiple players (should be disabled)
   - Remove players using the X button on selected player cards
   - **Enter a team name** (3-30 characters required)
   - See validation errors if name is too short/long
   - Finalize the team when all requirements are met

4. **Test existing team view:**
   - After creating a team, reload the page
   - Should see your existing team instead of draft interface
   - View team stats: total points, budget remaining
   - See all 5 players with their roles and stats
   - Click "Replace" on any player to open substitution dialog
   - Search and filter available replacement players
   - See budget impact calculation (sell + buy)
   - Confirm substitution (max 2 per week)

5. **Test leaderboard:**
   - Navigate to Fantasy League → Leaderboard
   - See top 50 fantasy teams ranked by points
   - Your team should be highlighted if in top 50
   - View team names, points, and player counts

6. **Test price history:**
   - Navigate to Fantasy League → Price History
   - See player value changes over time
   - View current vs previous values
   - See percentage change indicators

## UI/UX Highlights

### Design Patterns (Modern Esports Trading Card Style)

- **Top Section:** Budget display, team slots counter, division selector
- **Selected Team Panel:** Horizontal row of 5 player slots with angular design
- **Players by Team:** Players grouped by team with horizontal scrolling (overflow-y hidden)
- **Player Cards:** Flippable modern esports trading card design
  - **Smooth Rounded Corners:** 16px border-radius for polished, modern appearance
  - **Gradient Frames:** 4px gradient borders (gold/silver/bronze) with glow effects
  - **Front:** Player photo, quick stats (Rating/K/D/Kills), tier-colored highlights
  - **Back:** Detailed stats with color-coded values (green kills, red deaths, etc.)
  - **Typography:** Bold, uppercase, tracking-wider for esports feel
- **Tier Indication:**
  - Gradient borders with glowing shadows
  - Color-coded text with drop-shadow effects
  - Angular tier badges with clip-path styling
- **Team Logos:** Displayed with gradient frames matching tier colors
- **Interaction:** Hover to flip (desktop), touch to flip (mobile)
- **Visual Effects:**
  - Layered gradient overlays
  - Backdrop blur effects
  - Color-coded stat values with glow
  - Smooth rounded corners on all elements (buttons, badges, name banners)

### Responsive Behavior

- Mobile: 2-column selected team grid, stacked components
- Tablet: 3-column selected team grid
- Desktop: 5-column selected team grid (one row)
- Player team rows: Horizontal scrolling on all screen sizes
- Each team section shows players in scrollable row

### Visual Hierarchy

- Tier colors as card borders:
  - 🥉 Bronze: Amber border (border-amber-600)
  - 🥈 Silver: Slate border (border-slate-400)
  - 🥇 Gold: Yellow border (border-yellow-500)
- Background gradients matching tier colors
- Budget in green when positive, red when negative
- Disabled states for unavailable actions
- Clear CTAs for primary actions

## Player Tiers and Values (Data-Driven Balancing)

Based on statistical analysis of actual player ratings from the database:

### Tier Thresholds (Kana Rating Distribution)

- **🥇 Gold Tier** (rating >= 0.95): Top ~15% of players
  - Value range: $220K-$260K
  - Example: Top performers with rating 0.95-1.30
- **🥈 Silver Tier** (rating 0.80-0.94): Middle ~35% of players
  - Value range: $140K-$180K
  - Example: Consistent performers with rating 0.80-0.94
- **🥉 Bronze Tier** (rating < 0.80): Bottom ~50% of players
  - Value range: $60K-$120K
  - Example: Developing players with rating 0.25-0.79

### Value Calculation Formula (Normalized Distribution)

Uses **sigmoid compression** to cluster most players around $200K average:

```typescript
// Normalize rating (0.40-1.10 range) to 0-1
normalized = (rating - 0.40) / 0.70

// Apply sigmoid compression (gentler S-curve)
compressed = 1 / (1 + e^(-6 * (normalized - 0.5)))

// Map to range: $165K-$235K base
baseValue = 165,000 + (compressed * 70,000)

// Small adjustments
+ K/D bonus (±4% for K/D around 1.0)
+ Kill volume bonus (up to +2.5%)
```

**Constraints:** Min $160K, Max $240K per player  
**Distribution:** Tightly clustered around $200K average

### Strategic Team Building

With a **$1,000,000 budget** for 5 players (~$200K average):

- **❌ 5 Gold players:** $1,155K (over budget - impossible)
- **❌ Balanced team:** $1,035K (slightly over budget)
- **❌ Mixed (2G+3B):** $1,039K (slightly over budget)
- **✅ Strategic mix required:** Must carefully balance ratings and bonuses

The normalized distribution creates a **tight market** where every 5-10K matters, forcing careful strategic choices and trade-offs between star power and budget constraints.

## Backend Implementation (Completed)

### Database

1. **Migrations Created:**
   - `fantasy_teams` - User fantasy teams with budget tracking
   - `fantasy_team_players` - Team rosters with roles and values
   - `fantasy_player_values` - Historical player pricing
   - `fantasy_player_history` - Value change tracking
   - `fantasy_points_log` - Game-by-game point records
   - `fantasy_leaderboard` - Weekly standings

### API Endpoints

All endpoints implemented in `/api/v1/seasons/:season_id/fantasy/`:

- ✅ `GET /leagues/:league_id/players` - Fetch all players with stats
- ✅ `POST /teams` - Create new fantasy team (with auth)
- ✅ `GET /teams/me` - Get user's existing team (with auth)
- ✅ `PUT /teams/me/players` - Substitute players (with auth)
- ✅ `PUT /teams/me/roles` - Update player roles (with auth)
- ✅ `GET /leagues/:league_id/leaderboard` - View rankings
- ✅ `GET /leagues/:league_id/price-history` - Track price changes
- ✅ `POST /leagues/:league_id/seed-values` - Admin endpoint for initial values

### Services

1. **Fantasy Value Service** (`fantasy-value.service.ts`):
   - Calculate initial player values using sigmoid normalization
   - Calculate player tiers (Gold/Silver/Bronze) based on value thresholds
   - Value change calculations with ±10% cap per match

2. **Fantasy Points Service** (`fantasy-points.service.ts`):
   - Calculate points after each match game
   - Apply role-based multipliers (18 different roles)
   - **Instant price updates** after each match (not weekly)
   - Uses priority order for value calculation: `FantasyPlayerValues` → snapshot → historical stats → current match
   - Update team totals and leaderboard

### Integration

- Points calculation integrated into demo processing pipeline
- Automatic point updates when match demos are parsed
- Price history tracking with weekly snapshots

## Remaining Work

1. **Testing:**
   - Unit tests for backend services
   - Integration tests for API endpoints
   - E2E tests for fantasy user flows

2. **UX Polish:**
   - Loading skeletons for all data fetching
   - Toast notifications for success/error states
   - Confirmation dialogs for critical actions
   - Help text and tooltips for complex features

3. **Advanced Features:**
   - Real-time substitution tracking (calculate week number)
   - Admin dashboard for fantasy management
   - Email notifications for price changes
   - Push notifications for match events

4. **Performance:**
   - Caching strategies for player data
   - Optimize database queries
   - Add pagination for large datasets

## File Structure

```
apps/frontend/src/
├── app/(main)/(content-container)/seasons/[season]/fantasy/
│   ├── page.tsx                              # Main fantasy page
│   ├── leaderboard/page.tsx                  # Leaderboard view
│   └── price-history/page.tsx                # Price history view
├── components/fantasy/
│   ├── FantasyLeague.tsx                     # Main component (draft & team view)
│   ├── FantasyPlayerFlipCard.tsx             # Flippable player trading card
│   ├── SelectedTeamPanel.tsx                 # Selected team panel (draft mode)
│   └── SubstitutionDialog.tsx                # Player substitution modal
├── hooks/data/
│   ├── useFantasyPlayers.tsx                 # Fetch players for league
│   ├── useMyFantasyTeam.tsx                  # Fetch user's team
│   └── useSeasonLeagues.tsx                  # Fetch available leagues
└── components/layout/
    └── Navigation.tsx                        # Updated with Fantasy submenu

apps/backend/src/
├── controllers/
│   └── fantasy.controllers.ts                # All fantasy API controllers
├── models/
│   └── fantasy.models.ts                     # Database queries
├── services/
│   ├── fantasy-value.service.ts              # Value & tier calculations
│   ├── fantasy-points.service.ts             # Points calculation & instant price updates
│   └── parsed-queue-consumer.ts              # Integrated points calc
├── routes/v1/
│   └── season.routes.ts                      # Fantasy routes
└── migrations/
    └── 20251124000001_create_fantasy_league_tables.ts

docs/
├── fantasy-league.md                         # Complete design spec
└── fantasy-league-implementation.md          # This file
```

## Design Decisions

1. **Budget:** Set at $1,000,000 for easy mental math
2. **Team Size:** 5 players (standard CS:GO/CS2 team)
3. **Roles:** 5 unique roles matching CS gameplay (Leader, Entry, Support, Multi, Eco)
4. **Tiers:** 3 tiers with metallic color schemes
5. **Mock Data:** 21 players across 3 teams (FaZe Clan: 7, Legacy: 8, Mibu Wolves: 6)
6. **Horizontal Layout:** Selected team at top, players grouped by team with horizontal scrolling
7. **Premium Trading Card Design:**
   - **Metallic Gradients:** Proper gold (#FFD866/#E0A424/#A06A1C), silver (#E8E8E8/#C0C0C0/#8C8C8C), bronze (#E09E5C/#B8753C/#8B5A2B)
   - **Inner Borders:** Dark outline inside frame for depth
   - **Inset Shadows:** Beveled effect with inner glow
   - **Outer Drop Shadow:** Card appears lifted (0_8px_20px with tier-colored glow)
   - **Smooth Rounded Corners:** rounded-2xl (16px border-radius) for polished, modern look
8. **Premium UI Elements:**
   - **Tier Badge:** Ribbon/pill style with shine overlay
   - **Name Banner:** Taller with gradient, bevel effect, and angular top corners
   - **Stats Section:** Column separators, hierarchy (large numbers, small labels), backdrop blur
   - **Collectible Button:** Themed to match tier colors, angular clip-path, glossy shine effect
   - **Team Logo:** Gradient frame matching tier colors
9. **Visual Effects:**
   - Hex pattern background texture (3% opacity)
   - Radial spotlight vignette on player photo
   - Layered gradient overlays (20% tier color)
   - Text drop shadows and glows
   - Shine overlays on buttons and banners
10. **Card Size:** 220px width, 420px height
11. **Flip Interaction:** Hover on desktop, touch on mobile
12. **Stats Hierarchy:** Main stats (Rating/K/D/Kills) on front, detailed stats on back
13. **Spacing:** Tightened top padding, optimized vertical rhythm
14. **Color Theory:** Adjusted for metallic appearance with proper highlights and shadows
15. **Scrollable Teams:** Horizontal scroll with overflow-y hidden to prevent vertical scrollbars

## Known Limitations

- No player photos (placeholder "?")
- Mock team logos (using nologo.png placeholder for some teams)
- Admin interface for managing fantasy seasons not yet implemented
- Email/push notifications not yet implemented

## Recent Bug Fixes

### Value Calculation Priority (Fixed)

- **Issue**: Snapshot value was prioritized over current value, causing incorrect incremental updates
- **Fix**: Changed priority order to check `FantasyPlayerValues` first, then snapshot value
- **Impact**: Values now update correctly after each match, building incrementally

### Rank Display (Fixed)

- **Issue**: Rank was not displaying correctly or showing "-"
- **Fix**: Updated to use `steam_id` from team data and fetch from leaderboard API
- **Impact**: Rank now shows as "X / Y" (user rank / total teams in division)

### Card Stats Layout (Fixed)

- **Issue**: Last 4 stats (Flash Assists, FK/FD, ADR T, ADR CT) were horizontally aligned
- **Fix**: Changed to 2-column vertical layout with value on top, label below
- **Impact**: Better visual consistency and readability

---

**Status:** PoC Complete ✅  
**Date:** 2025-11-23  
**Next Phase:** Backend API + Database Integration
