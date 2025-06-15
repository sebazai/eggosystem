import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("SeasonPlayerApprovals", (table) => {
    table.increments("id").primary();
    table
      .bigInteger("steam_id")
      .notNullable()
      .references("steam_id")
      .inTable("SteamPlayers");
    table
      .integer("season_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Seasons")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("organization_id")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("Organizations")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("team_id")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("Teams")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .integer("approved_by_id")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");

    table.timestamp("approved_at").notNullable().defaultTo(knex.fn.now());
    table.string("ticket_id").nullable();
    table.text("details").nullable();
    table.timestamps(true, true);
    table.unique(["steam_id", "season_id", "organization_id", "team_id"], {
      indexName: "unique_steam_id_season_id_organization_id_team_id"
    });
  });

  // Create trigger to check that organization_id and team_id are not both null
  await knex.raw(`
    CREATE TRIGGER check_team_or_organization
    BEFORE INSERT ON SeasonPlayerApprovals
    FOR EACH ROW
    BEGIN
      IF NEW.organization_id IS NULL AND NEW.team_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Either organization_id or team_id must be provided';
      END IF;
    END;
  `);

  // Create trigger for updates as well
  await knex.raw(`
    CREATE TRIGGER check_team_or_organization_update
    BEFORE UPDATE ON SeasonPlayerApprovals
    FOR EACH ROW
    BEGIN
      IF NEW.organization_id IS NULL AND NEW.team_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Either organization_id or team_id must be provided';
      END IF;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw(`DROP TRIGGER IF EXISTS check_team_or_organization`);
  await knex.raw(`DROP TRIGGER IF EXISTS check_team_or_organization_update`);
  await knex.schema.dropTable("SeasonPlayerApprovals");
}
