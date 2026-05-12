import type { Knex } from "knex";

export const config = { transaction: false };

// Fix primary-player conflict triggers to ignore discarded rows.
// Without this, discarding a primary player from one team would still block
// adding the same player as primary on another team.
export async function up(knex: Knex): Promise<void> {
  // Recreate triggers to ensure the updated logic is applied.
  await knex.raw("DROP TRIGGER IF EXISTS before_insert_primary_check;");
  await knex.raw("DROP TRIGGER IF EXISTS before_update_primary_check;");

  await knex.raw(`
    CREATE TRIGGER before_insert_primary_check
    BEFORE INSERT ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE conflicting_team_id INT;

      IF NEW.role = 'primary' AND NEW.discarded_at IS NULL THEN
        SELECT team_id INTO conflicting_team_id
        FROM SeasonTeamPlayers
        WHERE season_id = NEW.season_id
          AND role = 'primary'
          AND steam_id = NEW.steam_id
          AND discarded_at IS NULL
        LIMIT 1;

        IF conflicting_team_id IS NOT NULL THEN
          SET @errorMsg = CONCAT(
            'Player ', NEW.steam_id,
            ' is already registered as primary for team ',
            conflicting_team_id,
            ' in season ', NEW.season_id, '.'
          );
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER before_update_primary_check
    BEFORE UPDATE ON SeasonTeamPlayers
    FOR EACH ROW
    BEGIN
      DECLARE conflicting_team_id INT;

      IF NEW.role = 'primary' AND NEW.discarded_at IS NULL THEN
        SELECT team_id INTO conflicting_team_id
        FROM SeasonTeamPlayers
        WHERE season_id = NEW.season_id
          AND role = 'primary'
          AND steam_id = NEW.steam_id
          AND discarded_at IS NULL
          AND id <> NEW.id
        LIMIT 1;

        IF conflicting_team_id IS NOT NULL THEN
          SET @errorMsg = CONCAT(
            'Player ', NEW.steam_id,
            ' is already registered as primary for team ',
            conflicting_team_id,
            ' in season ', NEW.season_id, '.'
          );
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TRIGGER IF EXISTS before_insert_primary_check;");
  await knex.raw("DROP TRIGGER IF EXISTS before_update_primary_check;");
}
