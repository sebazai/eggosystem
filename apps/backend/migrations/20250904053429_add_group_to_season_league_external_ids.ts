import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // From SeasonLeagueExternalIds table, add group column which is parsed from external_league_name Lohko A, Lohko B, etc.
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table
      .integer("manual_group")
      .nullable()
      .comment("Manual group parsed from external_league_name");
  });
  // Get all and parse the name
  const seasonLeagueExternalIds = await knex("SeasonLeagueExternalIds").select(
    "*"
  );

  for (const seasonLeagueExternalId of seasonLeagueExternalIds) {
    const groupMatch =
      seasonLeagueExternalId.external_league_name.match(/Lohko (\w+)/);
    const group = groupMatch ? groupMatch[1] : null;
    const manualGroup = group === "A" ? 1 : group === "B" ? 2 : null;

    await knex("SeasonLeagueExternalIds")
      .where("id", seasonLeagueExternalId.id)
      .update({ manual_group: manualGroup });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonLeagueExternalIds", (table) => {
    table.dropColumn("manual_group");
  });
}
