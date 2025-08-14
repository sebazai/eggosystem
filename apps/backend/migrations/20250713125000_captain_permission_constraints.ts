import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First, let's clean up any existing orphaned permissions
  await knex.raw(`
    DELETE aps FROM AccountPermissionScopes aps
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
      OR strp.team_id IS NULL 
      OR strp.steam_id IS NULL
      OR (strp.is_captain = 0 AND strp.is_co_captain = 0)
  `);

  // Also clean up AccountRoles for captains that are no longer captains
  await knex.raw(`
    DELETE ar FROM AccountRoles ar
    JOIN Roles r ON r.id = ar.role_id
    WHERE r.role_name = 'captain'
    AND ar.account_id NOT IN (
      SELECT DISTINCT la.account_id
      FROM SeasonTeamRegistrationPlayers strp
      JOIN LinkedAccounts la ON la.provider = 'steam' AND la.provider_id = CAST(strp.steam_id AS CHAR)
      WHERE (strp.is_captain = 1 OR strp.is_co_captain = 1)
    )
  `);

  // Create a function to get account_id from steam_id
  await knex.raw(`
    CREATE FUNCTION get_account_id_from_steam_id(steam_id_param BIGINT) 
    RETURNS INT UNSIGNED
    READS SQL DATA
    DETERMINISTIC
    BEGIN
      DECLARE account_id_result INT UNSIGNED;
      
      SELECT la.account_id INTO account_id_result
      FROM LinkedAccounts la
      WHERE la.provider = 'steam' 
      AND la.provider_id = CAST(steam_id_param AS CHAR)
      LIMIT 1;
      
      RETURN account_id_result;
    END
  `);

  // Create trigger to validate AccountPermissionScopes on INSERT
  await knex.raw(`
    CREATE TRIGGER validate_captain_permission_on_insert
    BEFORE INSERT ON AccountPermissionScopes
    FOR EACH ROW
    BEGIN
      DECLARE captain_status BOOLEAN DEFAULT FALSE;
      DECLARE steam_id_found BIGINT;
      
      -- Check if this permission is for a captain-related permission
      IF EXISTS (
        SELECT 1 FROM Permissions p 
        WHERE p.id = NEW.permission_id 
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
      ) THEN
        
        -- Find the steam_id for this account
        SELECT strp.steam_id INTO steam_id_found
        FROM SeasonTeamRegistrationPlayers strp
        WHERE strp.season_id = NEW.season_id
        AND strp.team_id = NEW.team_id
        AND get_account_id_from_steam_id(strp.steam_id) = NEW.account_id
        LIMIT 1;
        
        -- Check if this account is actually a captain or co-captain for this season/team
        SELECT (is_captain = 1 OR is_co_captain = 1) INTO captain_status
        FROM SeasonTeamRegistrationPlayers
        WHERE season_id = NEW.season_id
        AND team_id = NEW.team_id
        AND steam_id = steam_id_found;
        
        IF NOT captain_status THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot assign captain permissions to non-captain/co-captain player';
        END IF;
      END IF;
    END
  `);

  // Create trigger to validate AccountPermissionScopes on UPDATE
  await knex.raw(`
    CREATE TRIGGER validate_captain_permission_on_update
    BEFORE UPDATE ON AccountPermissionScopes
    FOR EACH ROW
    BEGIN
      DECLARE captain_status BOOLEAN DEFAULT FALSE;
      DECLARE steam_id_found BIGINT;
      
      -- Check if this permission is for a captain-related permission
      IF EXISTS (
        SELECT 1 FROM Permissions p 
        WHERE p.id = NEW.permission_id 
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
      ) THEN
        
        -- Find the steam_id for this account
        SELECT strp.steam_id INTO steam_id_found
        FROM SeasonTeamRegistrationPlayers strp
        WHERE strp.season_id = NEW.season_id
        AND strp.team_id = NEW.team_id
        AND get_account_id_from_steam_id(strp.steam_id) = NEW.account_id
        LIMIT 1;
        
        -- Check if this account is actually a captain or co-captain for this season/team
        SELECT (is_captain = 1 OR is_co_captain = 1) INTO captain_status
        FROM SeasonTeamRegistrationPlayers
        WHERE season_id = NEW.season_id
        AND team_id = NEW.team_id
        AND steam_id = steam_id_found;
        
        IF NOT captain_status THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Cannot assign captain permissions to non-captain/co-captain player';
        END IF;
      END IF;
    END
  `);

  // Create trigger to clean up permissions when SeasonTeamRegistrationPlayers captain status changes
  await knex.raw(`
    CREATE TRIGGER cleanup_captain_permissions_on_update
    AFTER UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
      
      -- If captain or co-captain status was removed, clean up permissions
      IF (OLD.is_captain = 1 AND NEW.is_captain = 0) OR (OLD.is_co_captain = 1 AND NEW.is_co_captain = 0) THEN
        
        -- Remove captain-related permissions for this season/team
        DELETE aps FROM AccountPermissionScopes aps
        JOIN Permissions p ON p.id = aps.permission_id
        WHERE aps.account_id = account_id_found
        AND aps.season_id = NEW.season_id
        AND aps.team_id = NEW.team_id
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
        
        -- Check if this account has any other captain permissions
        IF NOT EXISTS (
          SELECT 1 FROM AccountPermissionScopes aps2
          JOIN Permissions p2 ON p2.id = aps2.permission_id
          WHERE aps2.account_id = account_id_found
          AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
        ) THEN
          -- Remove captain role if no other captain permissions exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
  `);

  // Create trigger to clean up permissions when SeasonTeamRegistrationPlayers row is deleted
  await knex.raw(`
    CREATE TRIGGER cleanup_captain_permissions_on_delete
    AFTER DELETE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      
      -- Get the account_id for this steam_id
      SET account_id_found = get_account_id_from_steam_id(OLD.steam_id);
      
      -- If this was a captain or co-captain, clean up permissions
      IF OLD.is_captain = 1 OR OLD.is_co_captain = 1 THEN
        
        -- Remove captain-related permissions for this season/team
        DELETE aps FROM AccountPermissionScopes aps
        JOIN Permissions p ON p.id = aps.permission_id
        WHERE aps.account_id = account_id_found
        AND aps.season_id = OLD.season_id
        AND aps.team_id = OLD.team_id
        AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
        
        -- Check if this account has any other captain permissions
        IF NOT EXISTS (
          SELECT 1 FROM AccountPermissionScopes aps2
          JOIN Permissions p2 ON p2.id = aps2.permission_id
          WHERE aps2.account_id = account_id_found
          AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
        ) THEN
          -- Remove captain role if no other captain permissions exist
          DELETE ar FROM AccountRoles ar
          JOIN Roles r ON r.id = ar.role_id
          WHERE ar.account_id = account_id_found
          AND r.role_name = 'captain';
        END IF;
      END IF;
    END
  `);

  // Create trigger to clean up permissions when SeasonTeamRegistrations row is deleted (cascade scenario)
  await knex.raw(`
    CREATE TRIGGER cleanup_captain_permissions_on_registration_delete
    BEFORE DELETE ON SeasonTeamRegistrations
    FOR EACH ROW
    BEGIN
      DECLARE done INT DEFAULT FALSE;
      DECLARE steam_id_val BIGINT;
      DECLARE is_captain_val BOOLEAN;
      DECLARE is_co_captain_val BOOLEAN;
      DECLARE account_id_found INT UNSIGNED;
      DECLARE cur CURSOR FOR 
        SELECT steam_id, is_captain, is_co_captain 
        FROM SeasonTeamRegistrationPlayers 
        WHERE season_id = OLD.season_id AND team_id = OLD.team_id;
      DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
      
      OPEN cur;
      
      read_loop: LOOP
        FETCH cur INTO steam_id_val, is_captain_val, is_co_captain_val;
        IF done THEN
          LEAVE read_loop;
        END IF;
        
        -- If this was a captain or co-captain, clean up permissions
        IF is_captain_val = 1 OR is_co_captain_val = 1 THEN
          -- Get the account_id for this steam_id
          SET account_id_found = get_account_id_from_steam_id(steam_id_val);
          
          -- Remove captain-related permissions for this season/team
          DELETE aps FROM AccountPermissionScopes aps
          JOIN Permissions p ON p.id = aps.permission_id
          WHERE aps.account_id = account_id_found
          AND aps.season_id = OLD.season_id
          AND aps.team_id = OLD.team_id
          AND p.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions');
          
          -- Check if this account has any other captain permissions
          IF NOT EXISTS (
            SELECT 1 FROM AccountPermissionScopes aps2
            JOIN Permissions p2 ON p2.id = aps2.permission_id
            WHERE aps2.account_id = account_id_found
            AND p2.permission_name IN ('edit-registration', 'manage-team', 'captain-permissions')
          ) THEN
            -- Remove captain role if no other captain permissions exist
            DELETE ar FROM AccountRoles ar
            JOIN Roles r ON r.id = ar.role_id
            WHERE ar.account_id = account_id_found
            AND r.role_name = 'captain';
          END IF;
        END IF;
      END LOOP;
      
      CLOSE cur;
    END
  `);

  // Create trigger to add permissions when someone becomes captain/co-captain
  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_insert
    AFTER INSERT ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if this is a captain or co-captain
      IF NEW.is_captain = 1 OR NEW.is_co_captain = 1 THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        -- Add the captain role if it doesn't exist
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);

  // Create trigger to add permissions when someone becomes captain/co-captain on UPDATE
  await knex.raw(`
    CREATE TRIGGER add_captain_permissions_on_update
    AFTER UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      DECLARE account_id_found INT UNSIGNED;
      DECLARE permission_id_found INT UNSIGNED;
      DECLARE role_id_found INT UNSIGNED;
      
      -- Only proceed if captain or co-captain status was added
      IF ((OLD.is_captain = 0 AND NEW.is_captain = 1) OR (OLD.is_co_captain = 0 AND NEW.is_co_captain = 1)) THEN
        
        -- Get the account_id for this steam_id
        SET account_id_found = get_account_id_from_steam_id(NEW.steam_id);
        
        -- Get the edit-registration permission id
        SELECT id INTO permission_id_found FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1;
        
        -- Get the captain role id
        SELECT id INTO role_id_found FROM Roles WHERE role_name = 'captain' LIMIT 1;
        
        -- Add the permission scope if it doesn't exist
        INSERT IGNORE INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id)
        VALUES (account_id_found, permission_id_found, NEW.season_id, NEW.team_id);
        
        -- Add the captain role if it doesn't exist
        INSERT IGNORE INTO AccountRoles (account_id, role_id, game_id)
        VALUES (account_id_found, role_id_found, 1);
      END IF;
    END
  `);

  // Add indexes to improve performance
  await knex.schema.raw(`
    CREATE INDEX idx_season_team_registration_players_captain 
    ON SeasonTeamRegistrationPlayers(season_id, team_id, is_captain, is_co_captain)
  `);

  await knex.schema.raw(`
    CREATE INDEX idx_account_permission_scopes_captain_validation 
    ON AccountPermissionScopes(account_id, season_id, team_id, permission_id)
  `);

  // Add a constraint to ensure only one captain and one co-captain per team per season
  // Note: MySQL doesn't support CHECK constraints in the same way as other databases
  // We'll implement this through triggers instead
  await knex.raw(`
    CREATE TRIGGER unique_captain_per_team_season
    BEFORE INSERT ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      IF NEW.is_captain = 1 THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_captain = 1
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one captain allowed per team per season';
        END IF;
      END IF;
    END
  `);

  await knex.raw(`
    CREATE TRIGGER unique_co_captain_per_team_season
    BEFORE INSERT ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      IF NEW.is_co_captain = 1 THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_co_captain = 1
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one co-captain allowed per team per season';
        END IF;
      END IF;
    END
  `);

  // Also add triggers for UPDATE operations
  await knex.raw(`
    CREATE TRIGGER unique_captain_per_team_season_update
    BEFORE UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      IF NEW.is_captain = 1 AND (OLD.is_captain = 0 OR OLD.is_captain IS NULL) THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_captain = 1
          AND steam_id != NEW.steam_id
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one captain allowed per team per season';
        END IF;
      END IF;
    END
  `);

  await knex.raw(`
    CREATE TRIGGER unique_co_captain_per_team_season_update
    BEFORE UPDATE ON SeasonTeamRegistrationPlayers
    FOR EACH ROW
    BEGIN
      IF NEW.is_co_captain = 1 AND (OLD.is_co_captain = 0 OR OLD.is_co_captain IS NULL) THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrationPlayers 
          WHERE season_id = NEW.season_id 
          AND team_id = NEW.team_id 
          AND is_co_captain = 1
          AND steam_id != NEW.steam_id
        ) THEN
          SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Only one co-captain allowed per team per season';
        END IF;
      END IF;
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all triggers
  await knex.raw(
    "DROP TRIGGER IF EXISTS validate_captain_permission_on_insert"
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS validate_captain_permission_on_update"
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS cleanup_captain_permissions_on_update"
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS cleanup_captain_permissions_on_delete"
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS cleanup_captain_permissions_on_registration_delete"
  );
  await knex.raw("DROP TRIGGER IF EXISTS add_captain_permissions_on_insert");
  await knex.raw("DROP TRIGGER IF EXISTS add_captain_permissions_on_update");
  await knex.raw("DROP TRIGGER IF EXISTS unique_captain_per_team_season");
  await knex.raw("DROP TRIGGER IF EXISTS unique_co_captain_per_team_season");
  await knex.raw(
    "DROP TRIGGER IF EXISTS unique_captain_per_team_season_update"
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS unique_co_captain_per_team_season_update"
  );

  // Drop the function
  await knex.raw("DROP FUNCTION IF EXISTS get_account_id_from_steam_id");

  // Drop indexes
  await knex.schema.raw(
    "DROP INDEX IF EXISTS idx_season_team_registration_players_captain ON SeasonTeamRegistrationPlayers"
  );
  await knex.schema.raw(
    "DROP INDEX IF EXISTS idx_account_permission_scopes_captain_validation ON AccountPermissionScopes"
  );
}
