import type { Knex } from "knex";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(knex: Knex): Promise<void> {
  // Define the trigger creation statements
  await knex.raw(`
        CREATE TRIGGER before_insert_primary_check
        BEFORE INSERT ON SeasonTeamPlayers
        FOR EACH ROW
        BEGIN
          DECLARE conflicting_team_id INT;

          IF NEW.role = 'primary' THEN
            SELECT team_id INTO conflicting_team_id
            FROM SeasonTeamPlayers
            WHERE season_id = NEW.season_id
              AND role = 'primary'
              AND steam_id = NEW.steam_id
            LIMIT 1;

            IF conflicting_team_id IS NOT NULL THEN
              SET @errorMsg = CONCAT('Player ', NEW.steam_id,' is already registered as primary for team ', conflicting_team_id,' in season ', NEW.season_id, '.');
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
            END IF;
          END IF;
        END ;
      `);

  const createBeforeUpdateTrigger = `
        CREATE TRIGGER before_update_primary_check
        BEFORE UPDATE ON SeasonTeamPlayers
        FOR EACH ROW
        BEGIN
            DECLARE conflicting_team_id INT;

            IF NEW.role = 'primary' THEN
                SELECT team_id
                INTO conflicting_team_id
                FROM SeasonTeamPlayers
                WHERE season_id = NEW.season_id
                  AND role = 'primary'
                  AND steam_id = NEW.steam_id
                  AND (team_id <> NEW.team_id OR steam_id <> NEW.steam_id)
                LIMIT 1;

                IF conflicting_team_id IS NOT NULL THEN
                    SET @errorMsg = CONCAT('Player ', NEW.steam_id, ' is already registered as primary for team ', conflicting_team_id,' in season ', NEW.season_id, '.');
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
                END IF;
            END IF;
        END;
      `;

  await knex.raw(createBeforeUpdateTrigger);
}

export async function down(knex: Knex): Promise<void> {
  try {
    await knex.raw("DROP TRIGGER IF EXISTS before_insert_primary_check;");
    await knex.raw("DROP TRIGGER IF EXISTS before_update_primary_check;");
  } catch (error) {
    console.error(error);
  }
}
