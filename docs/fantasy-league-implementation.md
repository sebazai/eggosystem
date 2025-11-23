# Fantasy League - Implementation Guide (PoC)

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

### 2. Frontend PoC (Team Selection)

#### Routes

- **Page:** `apps/frontend/src/app/(main)/(content-container)/seasons/[season]/fantasy/page.tsx`
- **URL:** `/seasons/{seasonId}/fantasy`
- Accessible via the season navigation menu dropdown

#### Components

**Main Component:**

- `src/components/fantasy/FantasyLeague.tsx`
  - Main container for fantasy league
  - Division selection
  - Budget management ($1,000,000)
  - Player filtering (by tier: bronze/silver/gold)
  - Player sorting (by value, name, rating)
  - Team composition tracking (5 players)

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
    - Additional stats (ADR, HLTV 2.0) if available
    - Rounded action button
  - Hover to flip on desktop, touch to flip on mobile
  - Team logos displayed with gradient frames
- `src/components/fantasy/SelectedTeamPanel.tsx`
  - Shows selected team in horizontal row (5 slots)
  - Trading card style with smooth rounded corners
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

### 🚧 Not Yet Implemented

- [ ] Steam authentication integration
- [ ] Team save/persistence to database
- [ ] Points system integration
- [ ] Weekly substitutions
- [ ] Player stats tracking during season
- [ ] Leaderboard
- [ ] Historical tracking
- [ ] Team finalization API (POST endpoint)
- [ ] Player photos (currently using placeholder)

## How to Test

1. **Start the development server:**

   ```bash
   cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm dev
   ```

2. **Navigate to the page:**
   - Go to the home page
   - Click on the season menu (e.g., "Season 16")
   - Click on "Fantasy" in the dropdown

3. **Test the flow:**
   - Select a division from the dropdown
   - Notice players are now grouped by team with horizontal scrolling
   - Scroll horizontally within each team row to see all players
   - **Hover over a player card** (desktop) or **touch a card** (mobile) to flip and see stats
   - Notice the trading card design with decorative corners and team logos
   - Add players to your team (max 5, within $1,000,000 budget)
   - Selected team appears at the top in a horizontal row with trading card style
   - Try to add a 6th player (should be disabled)
   - Try to exceed budget (should show "Can't Afford")
   - Assign roles to players in the selected team panel (top section)
   - Try assigning the same role to multiple players (should be disabled)
   - Remove players using the X button on selected player cards
   - Notice colored borders on cards indicating tier (gold/silver/bronze) - 4px thick
   - Observe team logos on both selectable and selected player cards
   - Finalize the team when all 5 slots are filled

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

## Next Steps (Backend Integration)

1. **Database Setup:**
   - Run migrations for fantasy tables (see design doc)
   - Seed initial player values (DONE - using dynamic calculation)

2. **API Development:**
   - GET `/api/v1/seasons/:seasonId/leagues` (DONE)
   - GET `/api/v1/seasons/:seasonId/fantasy/leagues/:leagueId/players` (DONE)
   - POST `/api/v1/fantasy/:seasonId/team` (TODO)
   - PUT `/api/v1/fantasy/:seasonId/team/players` (TODO)

3. **Frontend Integration:**
   - Replace mock data with API calls
   - Add loading states
   - Add error handling
   - Implement team persistence
   - Add real player photos
   - Add team logos

4. **Authentication:**
   - Integrate with Steam OAuth
   - Use steam_id for team ownership
   - Protect fantasy routes

5. **Points System:**
   - Implement points calculation
   - Real-time/periodic updates
   - Leaderboard integration

6. **Testing:**
   - Unit tests for components
   - Integration tests for API
   - E2E tests for user flows

## File Structure

```
apps/frontend/src/
├── app/(main)/(content-container)/seasons/[season]/fantasy/
│   └── page.tsx                           # Fantasy route page
├── components/fantasy/
│   ├── FantasyLeague.tsx                  # Main component
│   ├── FantasyPlayerFlipCard.tsx          # Flippable player trading card
│   └── SelectedTeamPanel.tsx              # Selected team panel (top)
└── components/layout/
    └── Navigation.tsx                     # Updated with Fantasy link

docs/
├── fantasy-league.md                      # Complete design spec
└── fantasy-league-implementation.md       # This file
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

## Known Limitations (PoC)

- No persistence (refresh loses data)
- No authentication
- Static mock data
- No player photos (placeholder "?")
- Mock team logos (using nologo.png placeholder)
- No actual points calculation
- Finalize button shows alert instead of API call
- No validation for division selection requirement
- Team logos in mock data use placeholder path

These will be addressed in the backend implementation phase.

---

**Status:** PoC Complete ✅  
**Date:** 2025-11-23  
**Next Phase:** Backend API + Database Integration
