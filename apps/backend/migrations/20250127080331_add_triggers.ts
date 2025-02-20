import type { Knex } from "knex";

export const config = { transaction: false };

// Import Games, Leagues, and Seasons tables
export async function up(knex: Knex): Promise<void> {
  // Define the trigger creation statements
  const createBeforeInsertTrigger = `
        CREATE TRIGGER before_insert_primary_check
        BEFORE INSERT ON SeasonTeamPlayers
        FOR EACH ROW
        BEGIN
            IF NEW.role = 'primary' THEN
                IF (SELECT COUNT(*) FROM SeasonTeamPlayers
                    WHERE season_id = NEW.season_id
                      AND role = 'primary'
                      AND steam_id = NEW.steam_id) > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'A player can only be primary for one team per season';
                END IF;
            END IF;
        END;
      `;

  const createBeforeUpdateTrigger = `
        CREATE TRIGGER before_update_primary_check
        BEFORE UPDATE ON SeasonTeamPlayers
        FOR EACH ROW
        BEGIN
            IF NEW.role = 'primary' THEN
                IF (SELECT COUNT(*) FROM SeasonTeamPlayers
                    WHERE season_id = NEW.season_id
                      AND role = 'primary'
                      AND steam_id = NEW.steam_id
                      AND (team_id <> NEW.team_id OR steam_id <> NEW.steam_id)) > 0 THEN
                    SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'A player can only be primary for one team per season';
                END IF;
            END IF;
        END;
      `;

  await knex.raw(createBeforeInsertTrigger);
  await knex.raw(createBeforeUpdateTrigger);
}

export async function down(): Promise<void> {
  // NO-OP
}
