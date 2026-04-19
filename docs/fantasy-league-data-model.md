# Fantasy League Data Model Explanation

> **Note (audited 2026-04-19):** Written alongside the initial feature rollout. Verify column names and semantics against current migrations under `apps/backend/migrations/` and the generated table docs at `dbdoc/FantasyTeamPlayers.md` and `dbdoc/FantasyLeaderboard.md` before relying on specifics here.

## Overview

This document explains the fantasy league database schema, data duplication, and how values are stored and updated.

## Database Tables

### 1. `FantasyTeams`

- **Purpose**: Stores user-created fantasy teams
- **Key Fields**: `steam_id`, `season_id`, `league_id`, `budget_remaining`, `total_points`
- **Notes**: One team per user per season

### 2. `FantasyTeamPlayers`

- **Purpose**: Stores players on fantasy teams (roster)
- **Key Fields**:
  - `steam_id`: The player's Steam ID (renamed from `player_id` for clarity)
  - `player_value`: **Snapshot value** when player was added/substituted (for budget calculations)
  - `points_earned`: **Aggregated total** points earned by this player on this team
  - `individual_points`, `team_points`, `role_points`: Breakdown of aggregated points
- **Notes**:
  - `player_value` is a **snapshot** - it doesn't change after the player is added
  - Used for budget calculations (you buy/sell at the value when added)
  - Points are aggregated here for quick access

### 3. `FantasyPlayerValues`

- **Purpose**: Stores **current market value** of players (updated after each match)
- **Key Fields**:
  - `steam_id`: The player's Steam ID (renamed from `player_id` for clarity)
  - `value`: Current market value (updated after each match)
  - `tier`: Current tier (gold/silver/bronze) based on current value
  - `week_number`: Always `0` for match-based updates
  - `performance_stats`: JSON with latest match stats
- **Unique Constraint**: `(steam_id, season_id)` - one current value per player per season
- **Notes**:
  - Updated **instantly** after each match via `calculateFantasyPointsForGame`
  - Always get the latest value by `MAX(created_at)`
  - This is the **source of truth** for current player values

### 4. `FantasyPointsLog`

- **Purpose**: Detailed per-match point breakdown
- **Key Fields**:
  - `fantasy_team_player_id`: Links to `FantasyTeamPlayers`
  - `match_game_id`: The match this points entry is for
  - `points_earned`: Points earned in this specific match
  - `individual_points`, `team_points`, `role_points`: Breakdown for this match
  - `stats_breakdown`: JSON with player stats from match
  - `points_breakdown`: JSON with detailed point calculation breakdown
- **Unique Constraint**: `(fantasy_team_player_id, match_game_id)` - one entry per player per match
- **Notes**:
  - This is the **detailed history** - every match is logged here
  - Used for point history pages and detailed breakdowns

### 5. `FantasyPlayerHistory`

- **Purpose**: Audit trail for team changes (additions, removals, role changes, value updates)
- **Key Fields**:
  - `steam_id`: The player's Steam ID (renamed from `player_id` for clarity)
  - `action`: `added`, `removed`, `role_changed`, `points_updated`
  - `old_value`, `new_value`: JSON with old/new values
  - `week_number`: Week when action occurred
- **Notes**: Used for tracking substitutions, role swaps, and value changes

## Data Duplication Explained

### Why Do We Have Duplicate Data?

1. **`FantasyTeamPlayers.player_value` vs `FantasyPlayerValues.value`**
   - `FantasyTeamPlayers.player_value`: **Snapshot** when player was added (for budget)
   - `FantasyPlayerValues.value`: **Current market value** (for display)
   - **Why**: Budget calculations need the purchase price, not current value

2. **`FantasyTeamPlayers.points_earned` vs `FantasyPointsLog.points_earned`**
   - `FantasyTeamPlayers.points_earned`: **Aggregated total** (for quick access)
   - `FantasyPointsLog.points_earned`: **Per-match breakdown** (for history)
   - **Why**: Aggregation for performance (don't sum on every query)

### When Values Are Updated

1. **After Each Match** (`calculateFantasyPointsForGame`):
   - Updates `FantasyPlayerValues.value` (current market value)
   - Inserts into `FantasyPointsLog` (match history)
   - Updates `FantasyTeamPlayers.points_earned` (aggregated total)
   - Updates `FantasyTeams.total_points` (team total)
   - Logs to `FantasyPlayerHistory` (if value changed)

2. **When Player Is Added/Substituted**:
   - Sets `FantasyTeamPlayers.player_value` to current `FantasyPlayerValues.value`
   - This becomes the snapshot for budget calculations

## Column Naming: `player_id` → `steam_id`

### Why the Change?

- **Clarity**: The column stores Steam IDs, not generic player IDs
- **Consistency**: Matches naming in other tables (`SteamPlayers.steam_id`)
- **Avoid Confusion**: `player_id` could be confused with auto-increment IDs

### Tables Updated:

- `FantasyTeamPlayers`: `player_id` → `steam_id`
- `FantasyPlayerValues`: `player_id` → `steam_id`
- `FantasyPlayerHistory`: `player_id` → `steam_id`

## Unique Constraint Fix

### Problem

- Original constraint: `(player_id, season_id, week_number)` with `week_number = 0`
- This prevented multiple match-based updates (all matches had same `week_number`)

### Solution

- New constraint: `(steam_id, season_id)` (removed `week_number`)
- Always get latest value by `MAX(created_at)`
- Allows multiple updates per season (one per match)

## Value Calculation Priority Order

When calculating value changes after a match (`calculateFantasyPointsForGame`), the system uses a priority order to determine the base value:

1. **`FantasyPlayerValues.value`** (if exists) - **LATEST VALUE AFTER PREVIOUS MATCHES**
   - This ensures incremental updates work correctly
   - Each match builds on the previous match's value
   - Prevents recalculating from snapshot on every match

2. **`FantasyTeamPlayers.player_value`** (if player is on a team) - **INITIAL VALUE WHEN ADDED**
   - Snapshot value when player was added to a team
   - Used only if no `FantasyPlayerValues` entry exists yet
   - This is the starting point for value calculations

3. **Calculate from historical stats** - Average stats from previous matches in the season
   - Used if player has no value entries but has match history
   - Calculates initial value based on historical performance

4. **Calculate from current match stats** - Last resort fallback
   - Used only if player has no history and no value entries
   - Calculates initial value from the current match being processed

**Why This Priority Matters:**

- Without prioritizing `FantasyPlayerValues`, each match would recalculate from the snapshot value
- This would cause incorrect incremental updates (e.g., player goes from €225K → €240K → €240K instead of €225K → €240K → €240K)
- The priority ensures each match builds on the previous match's value, allowing proper incremental updates

## How to Get Current Player Value

### In `getFantasyTeamByUser`:

```sql
LEFT JOIN (
  SELECT
    fpv.steam_id,
    fpv.value,
    fpv.tier
  FROM FantasyPlayerValues fpv
  INNER JOIN (
    SELECT steam_id, MAX(created_at) as max_created
    FROM FantasyPlayerValues
    WHERE season_id = ?
    GROUP BY steam_id
  ) latest ON latest.steam_id = fpv.steam_id AND latest.max_created = fpv.created_at
) lv ON lv.steam_id = ftp.steam_id
```

This joins the current value from `FantasyPlayerValues` to the team players, overriding the snapshot value in `FantasyTeamPlayers.player_value` for display purposes.

## Summary

- **Snapshot values** (`FantasyTeamPlayers.player_value`): Used for budget calculations
- **Current values** (`FantasyPlayerValues.value`): Used for display and market pricing
- **Aggregated points** (`FantasyTeamPlayers.points_earned`): For quick access
- **Detailed points** (`FantasyPointsLog`): For history and breakdowns

All duplication serves a purpose: performance, historical tracking, or business logic (budget calculations).
