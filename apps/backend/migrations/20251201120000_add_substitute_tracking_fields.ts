import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    // Track which player this substitute replaces (for eligibility calculations)
    table.bigInteger("replaces_steam_id").nullable();

    // Track helpdesk ticket number for audit trail
    table.string("ticket_number", 255).nullable();

    // Add foreign key constraint for replaces_steam_id
    table
      .foreign("replaces_steam_id")
      .references("steam_id")
      .inTable("SteamPlayers")
      .onDelete("SET NULL")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropForeign("replaces_steam_id");
    table.dropColumn("replaces_steam_id");
    table.dropColumn("ticket_number");
  });
}
