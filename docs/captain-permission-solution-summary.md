# Captain Permission Constraints - Solution Summary

## Problem Statement

You needed to constrain `AccountPermissionScopes` so that:

1. Only actual captains/co-captains can have captain-related permissions
2. Permissions are automatically removed when captain status changes to false
3. Permissions are automatically removed when captain rows are deleted
4. Extra rows in `AccountPermissionScopes` and `AccountRoles` are cleaned up

## Solution Overview

I've created a comprehensive database-level solution using triggers, constraints, and helper functions that ensures data integrity between `SeasonTeamRegistrationPlayers` and `AccountPermissionScopes`.

## Key Components

### 1. Migration File: `20250127000000_captain_permission_constraints.sql`

This migration includes:

- **Cleanup of existing orphaned data**
- **Helper function** to convert Steam IDs to Account IDs
- **Validation triggers** to prevent invalid permission assignments
- **Automatic permission management** triggers
- **Data integrity constraints** to ensure one captain/co-captain per team
- **Performance indexes** for optimal query performance

### 2. Documentation: `docs/captain-permission-constraints.md`

Comprehensive documentation explaining:

- Database structure and relationships
- All triggers and their purposes
- Usage examples and error messages
- Maintenance procedures

### 3. Tests: `apps/backend/src/__tests__/database/captain-permission-constraints.test.ts`

Complete test suite covering:

- Automatic permission addition
- Automatic permission cleanup
- Validation triggers
- Data integrity constraints
- Helper function functionality

## How It Works

### Automatic Permission Management

1. **When someone becomes captain/co-captain:**
   - `add_captain_permissions_on_insert` trigger fires
   - Automatically adds 'edit-registration' permission scope
   - Automatically adds 'captain' role

2. **When captain status is revoked:**
   - `cleanup_captain_permissions_on_update` trigger fires
   - Removes captain-related permission scopes
   - Removes captain role if no other captain permissions exist

3. **When captain row is deleted:**
   - `cleanup_captain_permissions_on_delete` trigger fires
   - Same cleanup logic as status revocation

4. **When SeasonTeamRegistrations row is deleted (cascade scenario):**
   - `cleanup_captain_permissions_on_registration_delete` trigger fires
   - Iterates through all players and cleans up permissions for captains/co-captains before cascade deletion

### Validation

1. **Prevents invalid assignments:**
   - `validate_captain_permission_on_insert` and `validate_captain_permission_on_update`
   - Check if account is actually a captain/co-captain before allowing permission assignment

2. **Ensures data integrity:**
   - `unique_captain_per_team_season` and `unique_co_captain_per_team_season` constraints
   - Prevent multiple captains/co-captains per team per season

### Helper Function

- `get_account_id_from_steam_id()`: Converts Steam IDs to Account IDs for trigger logic

## Benefits

1. **Data Integrity**: Permissions always match captain status
2. **Automatic Management**: No manual permission management required
3. **Error Prevention**: Stops invalid permission assignments
4. **Cleanup**: Automatically removes orphaned permissions
5. **Performance**: Optimized with proper indexes
6. **Audit Trail**: All changes are automatic and consistent

## Migration Steps

1. **Run the migration:**

   ```bash
   cd $(git rev-parse --show-toplevel)/apps/backend && pnpm run migrate
   ```

2. **Verify the constraints work:**

   ```bash
   cd $(git rev-parse --show-toplevel)/apps/backend && pnpm test src/__tests__/database/captain-permission-constraints.test.ts
   ```

3. **Check for orphaned data:**
   ```sql
   -- Check for orphaned permissions
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
- **CHECK constraint violations**: Triggered when trying to have multiple captains/co-captains per team

## Maintenance

The solution includes:

- **Automatic cleanup** of orphaned permissions
- **Performance indexes** for optimal query performance
- **Comprehensive tests** to verify functionality
- **Documentation** for future maintenance

## Next Steps

1. **Review the migration** to ensure it meets your requirements
2. **Run the tests** to verify everything works correctly
3. **Deploy the migration** to your development environment
4. **Monitor the logs** to ensure triggers are working as expected
5. **Update application code** if needed to remove manual permission management

This solution provides a robust, database-level approach to ensuring that `AccountPermissionScopes` are always synchronized with captain status in `SeasonTeamRegistrationPlayers`, eliminating the need for manual permission management and preventing data inconsistencies.
