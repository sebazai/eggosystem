# Fantasy League Player Value Explanation

## Two Different Values

### 1. `FantasyTeamPlayers.player_value` (Snapshot)

- **What it is**: The value of the player **when you added them to your team**
- **When it's set**:
  - When you first create your team (draft)
  - When you substitute a player
- **When it changes**: **Never** - it's a snapshot
- **Purpose**: Budget calculations
  - When you buy a player, you pay their current market value
  - When you sell a player, you get back the value you paid (not current market value)
  - This prevents exploiting value changes for profit

**Example**:

- You buy Player A for €200K (their market value at that time)
- Player A plays well, their market value increases to €220K
- `FantasyTeamPlayers.player_value` = €200K (what you paid)
- `FantasyPlayerValues.value` = €220K (current market value)
- If you sell Player A, you get €200K back (what you paid), not €220K

### 2. `FantasyPlayerValues.value` (Current Market Value)

- **What it is**: The **current market value** of the player, updated after every match
- **When it's set**: After each match via `calculateFantasyPointsForGame`
- **When it changes**: After every match (instant pricing)
- **Purpose**: Display to users, market pricing
- **How it's calculated**:
  - Starts with initial value based on stats (rating, K/D, kills)
  - After each match: Uses the **latest value from `FantasyPlayerValues`** (or snapshot if first match)
  - Formula: `newValue = currentValue + (currentValue * (pointsEarned / 30) * 0.03)`
  - Capped at ±3% change per match (reduced from 5% for smoother progression over 14 games)
  - Clamped between €150K and €250K
  - **Important**: Each match builds on the previous match's value, not the snapshot value

**Example**:

- Player A starts at €200K
- Player A earns +15 points in a match
- New value = €200K + (€200K _ (15/30) _ 0.03) = €200K + €3K = €203K
- `FantasyPlayerValues.value` = €203K
- `FantasyPlayerValues.performance_stats` = `{"match_game_id": 107288, "individual_points": 15, "change_basis_points": 150, "value_change": 3000, "old_value": 200000}`

### 3. `FantasyPlayerValues.performance_stats` (Metadata)

- **What it is**: JSON metadata about the last value update
- **Fields**:
  - `match_game_id`: Which match triggered this update
  - `individual_points`: Points earned in that match
  - `change_basis_points`: Basis points for change calculation (500 = 5%)
  - `value_change`: Absolute change in value (€10,000)
  - `old_value`: Value before the match (€200,000)
- **Purpose**: Audit trail, debugging, potential future features (value history graph)

## Which Value Should Be Displayed?

**Always use `FantasyPlayerValues.value` (current market value) for display.**

The code already does this correctly:

- `getFantasyTeamByUser` joins `FantasyPlayerValues` and uses `current_value` for display
- The snapshot `FantasyTeamPlayers.player_value` is only used internally for budget calculations

## Value Update Flow

1. **Match finishes** → `calculateFantasyPointsForGame` is called
2. **Base value determined** → Uses priority order:
   - **First**: Check `FantasyPlayerValues.value` (latest value after previous matches)
   - **Second**: Check `FantasyTeamPlayers.player_value` (snapshot when added to team)
   - **Third**: Calculate from historical average stats
   - **Fourth**: Calculate from current match stats (last resort)
3. **Points calculated** → Individual points, team points, role points
4. **Value change calculated** → `newValue = currentValue + (currentValue * (pointsEarned / 30) * 0.03)`
   - Capped at ±3% change per match (reduced from 5% for smoother progression over 14 games)
   - Clamped between €150K and €250K
5. **Value updated** → `FantasyPlayerValues.value` updated (or inserted if doesn't exist)
6. **Metadata saved** → `FantasyPlayerValues.performance_stats` stores update details
7. **History logged** → `FantasyPlayerHistory` logs the change (if player is on a team)

**Critical**: The priority order ensures incremental updates work correctly. Without prioritizing `FantasyPlayerValues`, each match would recalculate from the snapshot value, causing incorrect value changes.

## Why Two Values?

**Budget Integrity**: Without snapshots, users could:

- Buy a player for €200K
- Player performs well, value increases to €220K
- Sell player for €220K
- Profit €20K without any skill - just exploiting value changes

**With snapshots**:

- Buy for €200K → `FantasyTeamPlayers.player_value` = €200K
- Value increases to €220K → `FantasyPlayerValues.value` = €220K (display only)
- Sell for €200K → Get back what you paid, no exploitation

## Summary

- **Display**: Always show `FantasyPlayerValues.value` (current market value)
- **Budget**: Use `FantasyTeamPlayers.player_value` (snapshot) for buy/sell calculations
- **Metadata**: `FantasyPlayerValues.performance_stats` is just for tracking/audit

The current implementation is correct - we display current values but use snapshots for budget.
