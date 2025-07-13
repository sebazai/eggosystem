# Captain Permission Constraints

This document explains the database constraints and triggers that ensure `AccountPermissionScopes` and `AccountRoles` are properly synchronized with captain/co-captain status in `SeasonTeamRegistrationPlayers`.

## Overview

The system enforces that:

1. Only actual captains/co-captains can have captain-related permissions
2. Permissions are automatically added when someone becomes captain/co-captain
3. Permissions are automatically removed when captain/co-captain status is revoked
4. Only one captain and one co-captain per team per season

## Database Structure

### Key Tables

- **`SeasonTeamRegistrationPlayers`**: Contains `is_captain` and `is_co_captain` boolean flags
- **`AccountPermissionScopes`**: Contains scoped permissions (season_id, team_id, account_id, permission_id)
- **`AccountRoles`**: Contains role assignments (account_id, role_id, game_id)
- **`LinkedAccounts`**: Links Steam IDs to Account IDs
- **`Permissions`**: Defines available permissions (e.g., 'edit-registration')
- **`Roles`**: Defines available roles (e.g., 'captain')

### Relationships

```
SeasonTeamRegistrationPlayers.steam_id
  → LinkedAccounts.provider_id (where provider = 'steam')
  → LinkedAccounts.account_id
  → AccountPermissionScopes.account_id
  → AccountRoles.account_id
```

## Constraints and Triggers

### 1. Validation Triggers

#### `validate_captain_permission_on_insert`

- **Purpose**: Prevents inserting captain permissions for non-captains
- **Trigger**: BEFORE INSERT on `AccountPermissionScopes`
- **Logic**: Checks if the account is actually a captain/co-captain for the specified season/team

#### `validate_captain_permission_on_update`

- **Purpose**: Prevents updating captain permissions for non-captains
- **Trigger**: BEFORE UPDATE on `AccountPermissionScopes`
- **Logic**: Same validation as insert trigger

### 2. Automatic Permission Management

#### `add_captain_permissions_on_insert`

- **Purpose**: Automatically adds permissions when someone becomes captain/co-captain
- **Trigger**: AFTER INSERT on `SeasonTeamRegistrationPlayers`
- **Logic**:
  - Adds 'edit-registration' permission scope
  - Adds 'captain' role

#### `add_captain_permissions_on_update`

- **Purpose**: Automatically adds permissions when captain status is granted
- **Trigger**: AFTER UPDATE on `SeasonTeamRegistrationPlayers`
- **Logic**: Same as insert trigger, but only when status changes from false to true

### 3. Automatic Cleanup

#### `cleanup_captain_permissions_on_update`

- **Purpose**: Removes permissions when captain status is revoked
- **Trigger**: AFTER UPDATE on `SeasonTeamRegistrationPlayers`
- **Logic**:
  - Removes captain-related permission scopes
  - Removes captain role if no other captain permissions exist

#### `cleanup_captain_permissions_on_delete`

- **Purpose**: Removes permissions when captain row is deleted
- **Trigger**: AFTER DELETE on `SeasonTeamRegistrationPlayers`
- **Logic**: Same as update cleanup

#### `cleanup_captain_permissions_on_registration_delete`

- **Purpose**: Removes permissions when SeasonTeamRegistrations row is deleted (cascade scenario)
- **Trigger**: BEFORE DELETE on `SeasonTeamRegistrations`
- **Logic**: Iterates through all players in the team registration and cleans up permissions for captains/co-captains before the cascade deletion occurs

### 4. Data Integrity Constraints

#### `unique_captain_per_team_season`

- **Purpose**: Ensures only one captain per team per season
- **Type**: CHECK constraint
- **Logic**: Counts captains per team/season and ensures ≤ 1

#### `unique_co_captain_per_team_season`

- **Purpose**: Ensures only one co-captain per team per season
- **Type**: CHECK constraint
- **Logic**: Counts co-captains per team/season and ensures ≤ 1

## Helper Function

### `get_account_id_from_steam_id(steam_id_param)`

- **Purpose**: Converts Steam ID to Account ID
- **Returns**: INT UNSIGNED (account_id)
- **Logic**: Looks up account_id in LinkedAccounts where provider = 'steam'

## Performance Indexes

- `idx_season_team_registration_players_captain`: Optimizes captain status queries
- `idx_account_permission_scopes_captain_validation`: Optimizes permission validation

## Migration Cleanup

The migration includes cleanup of existing orphaned data:

1. Removes `AccountPermissionScopes` for non-captains
2. Removes `AccountRoles` for accounts that are no longer captains anywhere

## Usage Examples

### Adding a Captain

```sql
-- This will automatically add permissions
INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain)
VALUES (1, 2, 76561198012345678, 1, 0);
```

### Removing Captain Status

```sql
-- This will automatically remove permissions
UPDATE SeasonTeamRegistrationPlayers
SET is_captain = 0
WHERE season_id = 1 AND team_id = 2 AND steam_id = 76561198012345678;
```

### Invalid Operation (Will Fail)

```sql
-- This will be prevented by validation triggers
INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
VALUES (123, 456, 1, 2); -- Where 123 is not a captain for season 1, team 2
```

## Error Messages

- **"Cannot assign captain permissions to non-captain/co-captain player"**: Triggered when trying to assign captain permissions to someone who isn't a captain/co-captain
- **"Team X is already registered for season Y"**: Triggered when trying to register the same team twice for a season
- **Platform ID conflicts**: Triggered when using duplicate external platform IDs

## Maintenance

### Checking for Orphaned Permissions

```sql
SELECT aps.*
FROM AccountPermissionScopes aps
LEFT JOIN SeasonTeamRegistrationPlayers strp ON
  aps.season_id = strp.season_id
  AND aps.team_id = strp.team_id
  AND aps.account_id = (
    SELECT la.account_id
    FROM LinkedAccounts la
    WHERE la.provider = 'steam'
    AND la.provider_id = CAST(strp.steam_id AS CHAR)
  )
WHERE strp.season_id IS NULL
  OR (strp.is_captain = 0 AND strp.is_co_captain = 0);
```

### Checking for Orphaned Roles

```sql
SELECT ar.*
FROM AccountRoles ar
JOIN Roles r ON r.id = ar.role_id
WHERE r.role_name = 'captain'
AND ar.account_id NOT IN (
  SELECT DISTINCT la.account_id
  FROM SeasonTeamRegistrationPlayers strp
  JOIN LinkedAccounts la ON la.provider = 'steam' AND la.provider_id = CAST(strp.steam_id AS CHAR)
  WHERE (strp.is_captain = 1 OR strp.is_co_captain = 1)
);
```

## Benefits

1. **Data Integrity**: Ensures permissions always match captain status
2. **Automatic Management**: No manual permission management required
3. **Prevention of Errors**: Stops invalid permission assignments
4. **Cleanup**: Automatically removes orphaned permissions
5. **Performance**: Optimized with proper indexes
6. **Audit Trail**: All changes are automatic and consistent
