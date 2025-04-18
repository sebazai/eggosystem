import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TRIGGER before_insert_team_registration
    BEFORE INSERT ON SeasonTeamRegistrations
    FOR EACH ROW
    BEGIN
      IF EXISTS (
        SELECT 1 FROM SeasonTeamRegistrations
        WHERE season_id = NEW.season_id AND team_id = NEW.team_id
      ) THEN
        SET @errorMsg = CONCAT('Team ', NEW.team_id, ' is already registered for season ', NEW.season_id);
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
      END IF;
    END;
`);
  await knex.raw(`
    CREATE TRIGGER before_update_team_registration
    BEFORE UPDATE ON SeasonTeamRegistrations
    FOR EACH ROW
    BEGIN
      -- Only check if season_id or team_id is changing
      IF NEW.season_id <> OLD.season_id OR NEW.team_id <> OLD.team_id THEN
        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND team_id = NEW.team_id
            -- Exclude the row being updated
            AND NOT (season_id = OLD.season_id AND team_id = OLD.team_id)
        ) THEN
          SET @errorMsg = CONCAT('Team ', NEW.team_id, ' is already registered for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  try {
    await knex.raw("DROP TRIGGER IF EXISTS before_insert_team_registration;");
    await knex.raw("DROP TRIGGER IF EXISTS before_update_team_registration;");
  } catch (error) {
    console.error(error);
  }
}
