import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Move all role primary from SeasonTeamPlayers into SeasonTeamRegistrationPlayers

  await knex("SeasonTeamPlayers").where("season_id", 16).del();

  // Get all primary players from SeasonTeamPlayers
  const primaryPlayers = await knex("SeasonTeamPlayers")
    .select("season_id", "team_id", "steam_id", "is_captain", "is_co_captain")
    .where("role", "primary");

  // Insert them into SeasonTeamRegistrationPlayers
  for (const player of primaryPlayers) {
    await knex("SeasonTeamRegistrationPlayers").insert({
      season_id: player.season_id,
      team_id: player.team_id,
      steam_id: player.steam_id,
      is_captain: player.is_captain,
      is_co_captain: player.is_co_captain
    });
  }
  await knex("SeasonTeamRegistrations")
    .update({ approved: true })
    .not.where("season_id", 16);
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
