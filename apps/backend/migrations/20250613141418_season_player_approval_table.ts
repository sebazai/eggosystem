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
      .inTable("Seasons");
    table
      .integer("organization_id")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("Organizations");
    table
      .integer("team_id")
      .nullable()
      .unsigned()
      .references("id")
      .inTable("Teams");
    table
      .integer("approved_by_id")
      .notNullable()
      .unsigned()
      .references("id")
      .inTable("Accounts");
    table.timestamp("approved_at").notNullable().defaultTo(knex.fn.now());
    table.string("ticket_id").nullable();
    table.text("details").nullable();
    table.timestamps(true, true);
    table.check(
      "team_id IS NOT NULL OR organization_id IS NOT NULL",
      undefined,
      "team_id_or_organization_id_must_be_present"
    );
    table.unique(["steam_id", "season_id", "organization_id", "team_id"], {
      indexName: "unique_steam_id_season_id_organization_id_team_id"
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("SeasonPlayerApprovals");
}
