import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.unique(["season_id", "external_platform_id"], {
      indexName: "unique_season_external_platform_id"
    });
  });
  await knex.raw(`
    CREATE TRIGGER before_insert_unique_external_platform
    BEFORE INSERT ON SeasonTeamRegistrations
    FOR EACH ROW
    BEGIN
      DECLARE platform_name VARCHAR(255);

      IF NEW.external_platform_id IS NOT NULL THEN
        -- Get the platform name from the Seasons table
        SELECT UPPER(platform) INTO platform_name
        FROM Seasons
        WHERE id = NEW.season_id
        LIMIT 1;

        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND external_platform_id = NEW.external_platform_id
        ) THEN
          SET @errorMsg = CONCAT(platform_name, ' Platform ID "', NEW.external_platform_id, '" is already used for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;
      END IF;
    END;
`);

  await knex.raw(`
    CREATE TRIGGER before_update_unique_external_platform
    BEFORE UPDATE ON SeasonTeamRegistrations
    FOR EACH ROW
    BEGIN
      DECLARE platform_name VARCHAR(255);
      
      IF (NEW.external_platform_id IS NOT NULL AND (
            NEW.external_platform_id <> OLD.external_platform_id OR
            NEW.season_id <> OLD.season_id
        )) THEN

        SELECT UPPER(platform) INTO platform_name
        FROM Seasons
        WHERE id = NEW.season_id
        LIMIT 1;

        IF EXISTS (
          SELECT 1 FROM SeasonTeamRegistrations
          WHERE season_id = NEW.season_id
            AND external_platform_id = NEW.external_platform_id
            AND NOT (season_id = OLD.season_id AND external_platform_id = OLD.external_platform_id)
        ) THEN
          SET @errorMsg = CONCAT(platform_name, ' Platform ID "', NEW.external_platform_id, '" is already used for season ', NEW.season_id, '.');
          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = @errorMsg;
        END IF;

      END IF;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  try {
    await knex.raw(
      "DROP TRIGGER IF EXISTS before_insert_unique_external_platform;"
    );
    await knex.raw(
      "DROP TRIGGER IF EXISTS before_update_unique_external_platform;"
    );
    await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
      table.dropUnique(
        ["season_id", "external_platform_id"],
        "unique_season_external_platform_id"
      );
    });
  } catch (error) {
    console.error(error);
  }
}
