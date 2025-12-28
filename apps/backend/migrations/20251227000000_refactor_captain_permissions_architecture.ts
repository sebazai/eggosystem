import type { Knex } from "knex";

/**
 * Migration to refactor captain permissions architecture:
 *
 * BEFORE:
 * - SeasonTeamRegistrationPlayers triggers granted BOTH captain role + edit-registration permission
 * - SeasonTeamPlayers had NO triggers
 * - This caused confusion about which table is the source of truth
 *
 * AFTER:
 * - SeasonTeamRegistrationPlayers triggers grant ONLY edit-registration permission (for registration phase)
 * - SeasonTeamPlayers triggers grant captain role + permissions (source of truth for finalized rosters)
 * - Clear separation: registration permissions vs actual captain status
 */

export async function up(knex: Knex): Promise<void> {
  // =================================================================
  // STEP 1: Modify SeasonTeamRegistrationPlayers triggers
  // Remove captain role grants, keep only edit-registration permission
  // =================================================================

  // Drop existing triggers that grant both role and permission
  await knex.raw(`DROP TRIGGER IF EXISTS add_captain_permissions_on_insert`);
  await knex.raw(`DROP TRIGGER IF EXISTS add_captain_permissions_on_update`);

  // Recreate triggers to ONLY grant edit-registration permission (no captain role)
  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_insert
    AFTER INSERT ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      
      -- Only proceed if this is a captain or co-captain
      IF NEW.is_captain = 1 OR NEW.is_co_captain = 1 THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist (NO ROLE GRANT)
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
      END IF;
    END
  `);

  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_update
    AFTER UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      
      -- Only proceed if captain or co-captain status was added
      IF ((OLD.is_captain = 0 AND NEW.is_captain = 1) OR (OLD.is_co_captain = 0 AND NEW.is_co_captain = 1)) THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist (NO ROLE GRANT)
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
      END IF;
    END
  `);

  // Keep cleanup triggers the same - they only remove scoped permissions, not the role
  // (The role should only be removed when all SeasonTeamPlayers entries are gone)

  // =================================================================
  // STEP 2: Create triggers for SeasonTeamPlayers
  // This table becomes the source of truth for captain role
  // =================================================================

  // Add captain role (NO PERMISSIONS) when captain is added to SeasonTeamPlayers
  // Registration is over at this point, so no edit-registration permission needed
  await knex.raw(`
    CREATE TRIGGER add_captain_role_on_seasonteamplayers_insert
    AFTER INSERT ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if this is a captain or co-captain
      IF NEW.is_captain = 1 OR NEW.is_co_captain = 1 THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the captain role if it doesn't exist (SOURCE OF TRUTH)
        -- Note: No permissions granted here - registration is closed
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);

  // Add captain role (NO PERMISSIONS) when captain status is granted via update
  await knex.raw(`
    CREATE TRIGGER add_captain_role_on_seasonteamplayers_update
    AFTER UPDATE ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if captain or co-captain status was added
      IF ((OLD.is_captain = 0 AND NEW.is_captain = 1) OR (OLD.is_co_captain = 0 AND NEW.is_co_captain = 1)) THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the captain role if it doesn't exist (SOURCE OF TRUTH)
        -- Note: No permissions granted here - registration is closed
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);

  // Remove captain role when captain status is revoked
  // Check if they're still captain in any other SeasonTeamPlayers entries
  await knex.raw(`
    CREATE TRIGGER cleanup_captain_role_on_seasonteamplayers_update
    AFTER UPDATE ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
      
      -- If captain or co-captain status was removed, check if we should remove the role
      IF (OLD.is_captain = 1 AND NEW.is_captain = 0) OR (OLD.is_co_captain = 1 AND NEW.is_co_captain = 0) THEN
        
        -- Check if this account is still captain/co-captain for any other team in SeasonTeamPlayers
        IF NOT EXISTS (
          SELECT 1 FROM SeasonTeamPlayers stp
          WHERE stp.steam_id = NEW.steam_id
          AND (stp.is_captain = 1 OR stp.is_co_captain = 1)
        ) THEN
          -- Remove captain role ONLY if no other captain assignments exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
  `);

  // Remove captain role when player is deleted from SeasonTeamPlayers
  await knex.raw(`
    CREATE TRIGGER cleanup_captain_role_on_seasonteamplayers_delete
    AFTER DELETE ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(OLD.steam_id);
      
      -- If this was a captain or co-captain, check if we should remove the role
      IF OLD.is_captain = 1 OR OLD.is_co_captain = 1 THEN
        
        -- Check if this account is still captain/co-captain for any other team in SeasonTeamPlayers
        IF NOT EXISTS (
          SELECT 1 FROM SeasonTeamPlayers stp
          WHERE stp.steam_id = OLD.steam_id
          AND (stp.is_captain = 1 OR stp.is_co_captain = 1)
        ) THEN
          -- Remove captain role if no other captain assignments exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
  `);

  // =================================================================
  // STEP 3: Data Migration - Grant captain roles to existing captains
  // For all existing captains in SeasonTeamPlayers who don't have the role yet
  // Note: We do NOT grant edit-registration permission here since registration is closed
  // =================================================================

  await knex.raw(`
    INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
    SELECT DISTINCT
      a.id as account_id,
      r.id as role_id,
      1 as game_id
    FROM SeasonTeamPlayers stp
    JOIN LinkedAccounts la ON la.provider_id = stp.steam_id AND la.provider = 'steam'
    JOIN Accounts a ON a.id = la.account_id
    CROSS JOIN Roles r
    WHERE r.role_name = 'captain'
    AND (stp.is_captain = 1 OR stp.is_co_captain = 1)
    AND NOT EXISTS (
      SELECT 1 FROM AccountRoles ar
      WHERE ar.account_id = a.id
      AND ar.role_id = r.id
      AND ar.game_id = 1
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Revert to the old behavior

  // Drop new SeasonTeamPlayers triggers
  await knex.raw(
    `DROP TRIGGER IF EXISTS add_captain_role_on_seasonteamplayers_insert`
  );
  await knex.raw(
    `DROP TRIGGER IF EXISTS add_captain_role_on_seasonteamplayers_update`
  );
  await knex.raw(
    `DROP TRIGGER IF EXISTS cleanup_captain_role_on_seasonteamplayers_update`
  );
  await knex.raw(
    `DROP TRIGGER IF EXISTS cleanup_captain_role_on_seasonteamplayers_delete`
  );

  // Restore old SeasonTeamRegistrationPlayers triggers (with captain role grants)
  await knex.raw(`DROP TRIGGER IF EXISTS add_captain_permissions_on_insert`);
  await knex.raw(`DROP TRIGGER IF EXISTS add_captain_permissions_on_update`);

  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_insert
    AFTER INSERT ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      IF NEW.is_captain = 1 OR NEW.is_co_captain = 1 THEN
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);

  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_update
    AFTER UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      IF ((OLD.is_captain = 0 AND NEW.is_captain = 1) OR (OLD.is_co_captain = 0 AND NEW.is_co_captain = 1)) THEN
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);
}
