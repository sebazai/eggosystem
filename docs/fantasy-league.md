# Fantasy League - Design Document

## Overview

The Fantasy League is a seasonal competition where players can create their own teams by drafting real Kanaliiga players and earn points based on their performance in actual matches.

## Core Features

### 1. Team Creation & Management

#### League Selection
- Users must first select which season division they want to play in
- They can only draft players from that specific division
- Each season has its own independent fantasy league

#### Team Drafting
- Users build a 5-player roster
- Each player has a value and tier (Bronze, Silver, Gold)
- Budget constraint prevents selecting all high-tier players
- Budget: $1,000,000 (adjustable)

#### Player Tiers & Budget System

**Tier Distribution:**
- **Gold:** Premium players (high past performance)
- **Silver:** Mid-tier players (consistent performance)
- **Bronze:** Entry-level or new players

**Budget Constraints Examples:**
- 5 Silver players: ~$200k each = $1,000k total ✓
- 2 Gold + 3 Bronze: ~$300k + ~$150k = $1,050k (tight but doable)
- 5 Gold players: ~$300k each = $1,500k total ✗ (over budget)

**Typical Player Values:**
- Bronze: $100k - $180k
- Silver: $180k - $250k
- Gold: $250k - $350k+

### 2. Player Valuation System

#### Initial Player Values

Player values are calculated before the season starts based on:

1. **Existing Players (played previous season):**
   - Base calculation: `kana_rating` (last season performance)
   - Modifier: `kana_elo` (current skill level)
   - Formula: `base_value = f(kana_rating, kana_elo)`

2. **New Players (never played in Kanaliiga):**
   - Primary factor: `kana_elo` approximation
   - Estimated tier based on ELO thresholds
   - Conservative initial value (e.g., $180k for unknown potential)

#### Dynamic Value Changes

Player values update throughout the season:
- **Performance-based:** Points earned, K/D ratio, ADR, clutches
- **Frequency:** Weekly updates (after match rounds)
- **Change rate:** ±5-15% per week based on performance
- **Example:** Player starts at $180k → performs well → rises to $235k

### 3. Team Composition & Roles

#### Player Roles
Users can assign roles to maximize points based on player specialization. Each role provides specific bonuses:

**Core Roles:**
- **Main AWP:** +20% bonus for AWP kills, sniper rifle eliminations count 1.5x
- **Leader:** +20% multiplier to all points earned (team captain bonus)
- **Support:** +25% bonus for assists and flash assists
- **Entry Fragger:** +30% bonus for opening kills (first kill of round)
- **Defender:** +20% bonus for kills while defending bomb site, holding angles

**Specialist Roles:**
- **HS Machine:** +25% bonus when headshot % > 50% in a map
- **Multi Fragger:** +30% bonus for 3K+ rounds (3, 4, 5 kill rounds)
- **Attacker:** +20% bonus for T-side performance (T-side kills × 1.2)
- **Camper:** +15% bonus for holding same position, retakes
- **Stathunter:** +15% bonus when player achieves rating > 1.0 in a map
- **Eco Friendly:** +30% bonus for kills on eco/force-buy rounds

**Meme/Fun Roles:**
- **Noob:** +50% bonus if K/D < 0.8 but still wins round (underdog points)
- **Flash Master:** +30% bonus for flash assists (minimum 3 per map)
- **Clutch Player:** +40% bonus for clutch wins (1vX situations)
- **First Blood:** +35% bonus for first kills, -15% penalty for first deaths

**Side-Specialist Roles:**
- **T-Side Specialist:** +25% bonus for T-side performance, T-side stats × 1.25
- **CT-Side Specialist:** +25% bonus for CT-side performance, CT-side stats × 1.25
- **Anchor:** +20% bonus for site holds, retakes, post-plant situations

**Constraints:**
- Each role can only be assigned to one player
- Not all players need a role (can have empty slots)
- Roles cannot be changed mid-week (locked after matches start)
- Maximum of 5 roles active (one per player)
- Some roles conflict (e.g., can't have both T-Specialist and CT-Specialist on same team)

#### Boosters (Future Feature)
- Weekly boosters can be applied to specific players
- Examples: "Double Points Weekend", "Opening Kill Specialist"
- Limited usage per season

### 4. Points System

#### Base Points
Players earn points based on real match statistics:

| Action | Points |
|--------|--------|
| Kill | +10 |
| Death | -5 |
| Assist | +5 |
| Flash Assist | +3 |
| Opening Kill (First Kill) | +12 |
| Opening Death (First Death) | -8 |
| Clutch Win (1v1) | +15 |
| Clutch Win (1v2) | +25 |
| Clutch Win (1v3+) | +40 |
| MVP Star | +20 |
| Match Win | +10 |
| Match Loss | -5 |
| ADR > 85 | +15 bonus |
| K/D > 1.3 | +12 bonus |
| KAST > 75% | +10 bonus |
| Headshot % > 50% | +8 bonus |
| 3K Round | +15 |
| 4K Round | +25 |
| Ace (5K) | +50 |

#### Role-Based Point Multipliers

Points are calculated as: `base_points × role_multiplier + role_bonuses`

**Example Calculations:**

1. **Entry Fragger with 2 opening kills in a map:**
   - Base: 2 opening kills × 12pts = 24pts
   - Role bonus: 24pts × 0.30 = +7.2pts
   - Total: 31.2pts from opening kills alone

2. **Main AWP with 15 kills (8 AWP kills):**
   - Base: 15 kills × 10pts = 150pts
   - Role bonus: 8 AWP kills × 10pts × 0.20 = +16pts
   - Total: 166pts

3. **Leader with overall strong performance:**
   - Base: All actions earn points
   - Role multiplier: ALL points × 1.20
   - Example: 150 base points → 180 total points

4. **Clutch Player with 2x 1v2 clutches:**
   - Base: 2 × 25pts = 50pts
   - Role bonus: 50pts × 0.40 = +20pts
   - Total: 70pts from clutches

5. **Multi Fragger with 3K + 4K rounds:**
   - Base: 3K (15pts) + 4K (25pts) = 40pts
   - Role bonus: 40pts × 0.30 = +12pts
   - Total: 52pts from multi-kill rounds

#### Role Synergies & Strategies

**Aggressive Lineup:**
- Entry Fragger + First Blood + Attacker + Multi Fragger + Leader
- Focus: Opening kills, T-side aggression, multi-kill potential
- Risk: High penalty for early deaths

**Balanced Lineup:**
- Leader + Main AWP + Support + HS Machine + Clutch Player
- Focus: Consistent performance, utility usage, clutch situations
- Safe choice for steady points

**Defensive Lineup:**
- Anchor + Defender + CT-Specialist + Camper + Support
- Focus: Site holds, retakes, CT-side dominance
- Best for CT-heavy maps

**Stat-Focused Lineup:**
- Stathunter + HS Machine + Leader + Flash Master + Eco Friendly
- Focus: Consistent stats, percentages, efficiency
- Rewards players with high accuracy and game sense

#### Advanced Scoring Mechanics

**Combo Bonuses:**
- Opening Kill → Win Round: +5 bonus
- Flash Assist → Kill within 2s: +2 bonus
- Clutch Win → High damage: +5 bonus
- Eco Round → 2+ kills: +10 bonus

**Penalties:**
- Team Damage: -3 per instance
- Early Death (first 15s): -2
- Losing round after advantage (3v1+): -5
- Saving when should plant/fight: -8

**Weekly Performance Multipliers:**
- Perfect Week (all matches won): +20% bonus
- Consistent Stats (rating > 1.0 all maps): +15% bonus
- MVP in >50% of maps: +25% bonus

### 5. Substitutions

- **Allowed:** 2 player substitutions per week
- **Timing:** Must be done before weekly matches start
- **Value constraint:** New player must fit within budget
- **Cooldown:** Substituted player cannot be re-added same week
- **History:** All substitutions are recorded for audit

### 6. Authentication & Data Storage

#### User Identification
- **Authentication:** `steam_id` (no separate login required)
- Users are identified through Steam OAuth integration
- One fantasy team per user per season

#### Database Schema

**Table: `fantasy_teams`**
```sql
CREATE TABLE fantasy_teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  steam_id VARCHAR(255) NOT NULL,
  season_id INT NOT NULL,
  division_id INT NOT NULL,
  team_name VARCHAR(100),
  budget_remaining DECIMAL(10,2),
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_season (steam_id, season_id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id)
);
```

**Table: `fantasy_team_players`**
```sql
CREATE TABLE fantasy_team_players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fantasy_team_id INT NOT NULL,
  player_id INT NOT NULL,
  role ENUM(
    'main_awp',
    'leader',
    'support',
    'entry_fragger',
    'defender',
    'hs_machine',
    'multi_fragger',
    'attacker',
    'camper',
    'stathunter',
    'noob',
    'eco_friendly',
    'flash_master',
    'clutch_player',
    'first_blood',
    't_specialist',
    'ct_specialist',
    'anchor'
  ) NULL,
  player_value DECIMAL(10,2) NOT NULL,
  points_earned INT DEFAULT 0,
  base_points INT DEFAULT 0,
  role_bonus_points INT DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (fantasy_team_id) REFERENCES fantasy_teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  INDEX idx_fantasy_team (fantasy_team_id, is_active),
  INDEX idx_role (role),
  INDEX idx_points (points_earned DESC)
);
```

**Table: `fantasy_player_history`**
```sql
CREATE TABLE fantasy_player_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fantasy_team_id INT NOT NULL,
  player_id INT NOT NULL,
  action ENUM('added', 'removed', 'role_changed', 'points_updated') NOT NULL,
  old_value JSON,
  new_value JSON,
  week_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fantasy_team_id) REFERENCES fantasy_teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  INDEX idx_team_history (fantasy_team_id, created_at)
);
```

**Table: `fantasy_player_values`**
```sql
CREATE TABLE fantasy_player_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_id INT NOT NULL,
  season_id INT NOT NULL,
  division_id INT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  tier ENUM('bronze', 'silver', 'gold') NOT NULL,
  week_number INT NOT NULL,
  performance_stats JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  UNIQUE KEY unique_player_week (player_id, season_id, week_number),
  INDEX idx_season_division (season_id, division_id)
);
```

**Table: `fantasy_leaderboard`**
```sql
CREATE TABLE fantasy_leaderboard (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fantasy_team_id INT NOT NULL,
  season_id INT NOT NULL,
  division_id INT NOT NULL,
  rank INT NOT NULL,
  total_points INT NOT NULL,
  week_number INT NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fantasy_team_id) REFERENCES fantasy_teams(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (division_id) REFERENCES divisions(id),
  INDEX idx_leaderboard (season_id, division_id, week_number, rank)
);
```

### 7. User Interface

#### Team Selection Page (Draft Phase)
Following HLTV Fantasy pattern:
- **Top Section:** Budget display, remaining slots, division info
- **Player Grid:** Cards showing:
  - Player photo
  - Name
  - Team logo
  - Current value
  - Tier (bronze/silver/gold indicator)
  - Stats preview
  - "Add to team" button (disabled if over budget)
- **Filters:**
  - Sort by: Value, Name, Rating, Team
  - Filter by: Tier, Team, Position
- **Selected Team Panel (Right Sidebar):**
  - 5 player slots with placeholders
  - Assigned roles dropdown for each
  - Budget tracker
  - "Finalize Team" button

#### Team Management Page
- **Team Overview:**
  - Current points
  - Rank in division
  - Budget status
- **Player Cards:**
  - Current value vs purchase value
  - Points earned this week
  - Season total points
  - Role assignment
- **Substitution Interface:**
  - Remaining substitutions counter
  - "Replace player" action
  - Available players list (budget-filtered)
- **Performance Charts:**
  - Weekly points progression
  - Player contribution breakdown

#### Leaderboard Page
- Division-specific rankings
- Team name, owner (steam name), total points
- Week-by-week points history
- Top performers highlights

### 8. Game Flow

#### Phase 1: Pre-Season (Draft)
1. User selects season and division
2. User drafts 5 players within budget
3. User assigns roles to players
4. User finalizes team (no changes until season starts)

#### Phase 2: Active Season
1. Weekly match rounds occur
2. Points calculated based on player performance
3. Points added to fantasy teams
4. Leaderboard updated
5. Users can make up to 2 substitutions per week
6. Player values update weekly

#### Phase 3: Post-Season
1. Final rankings displayed
2. Historical data preserved
3. Awards/badges for top performers
4. Stats archive for future reference

### 9. API Endpoints (Backend - Future Implementation)

```
GET    /api/v1/fantasy/:seasonId/divisions
GET    /api/v1/fantasy/:seasonId/:divisionId/players
GET    /api/v1/fantasy/:seasonId/:divisionId/player-values
POST   /api/v1/fantasy/:seasonId/team
GET    /api/v1/fantasy/:seasonId/team
PUT    /api/v1/fantasy/:seasonId/team/players
PUT    /api/v1/fantasy/:seasonId/team/roles
POST   /api/v1/fantasy/:seasonId/team/substitute
GET    /api/v1/fantasy/:seasonId/:divisionId/leaderboard
GET    /api/v1/fantasy/:seasonId/team/history
```

### 10. Future Enhancements

- **Private Leagues:** Create custom leagues with friends
- **Live Scoring:** Real-time point updates during matches
- **Achievements:** Badges for milestones (perfect week, underdog win, etc.)
- **Trade System:** Player trades between users (with value constraints)
- **Boosters:** Weekly power-ups for extra points
- **Mobile App:** Native mobile experience
- **Notifications:** Email/push for substitution deadlines, leaderboard changes
- **Historical Comparisons:** Compare teams across seasons

## Technical Considerations

### Performance
- Cache player values (update weekly, not real-time)
- Paginate player lists for large divisions
- Index database tables appropriately for leaderboard queries

### Security
- Validate all team changes server-side
- Prevent budget manipulation
- Rate limit API calls
- Ensure users can only modify their own teams

### Data Integrity
- Transaction support for team changes
- Audit trail for all actions
- Rollback capability for disputed points
- Archive completed seasons

## Success Metrics

- **Engagement:** % of hub users creating fantasy teams
- **Retention:** % of users active throughout season
- **Substitutions:** Average substitutions per user per week
- **Leaderboard:** Distribution of points (avoid runaway leaders)
- **Performance:** Page load times < 2s, API response < 500ms

## Open Questions

1. Should there be prizes for top fantasy teams?
2. Should we allow team changes during playoffs?
3. How to handle players who join/leave teams mid-season?
4. Should there be a minimum number of matches played to count?
5. What happens if a player gets banned/suspended?
6. Should we have a pre-season mock draft?

---

**Last Updated:** 2025-11-23  
**Status:** Design Phase  
**Next Steps:** Frontend PoC for team selection page

