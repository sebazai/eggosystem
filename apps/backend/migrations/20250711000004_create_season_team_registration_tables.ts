import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create SeasonTeamRegistrationPlayers table (player-level with roles, for Season 16+)
  await knex.schema.createTable("SeasonTeamRegistrationPlayers", (table) => {
    table.integer("season_id").unsigned().notNullable();
    table.integer("team_id").unsigned().notNullable();
    table.bigInteger("steam_id").notNullable();
    table.boolean("is_captain").notNullable().defaultTo(false);
    table.boolean("is_co_captain").notNullable().defaultTo(false);
    table.primary(["season_id", "team_id", "steam_id"]);
    table
      .foreign(["season_id", "team_id"])
      .references(["season_id", "team_id"])
      .inTable("SeasonTeamRegistrations")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("steam_id")
      .references("steam_id")
      .inTable("SteamPlayers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });

  // Alter existing SeasonTeamPlayers to add role booleans for past seasons
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.boolean("is_captain").notNullable().defaultTo(false);
    table.boolean("is_co_captain").notNullable().defaultTo(false);
  });

  // Fetch all registrations
  const allRegistrations = await knex("SeasonTeamRegistrations").whereNot(
    "season_id",
    16
  );

  for (const reg of allRegistrations) {
    if (reg.captain_steam_id) {
      const existingPlayer = await knex("SeasonTeamPlayers")
        .where({
          season_id: reg.season_id,
          team_id: reg.team_id,
          steam_id: reg.captain_steam_id
        })
        .first();

      if (existingPlayer) {
        await knex("SeasonTeamPlayers")
          .where({
            season_id: reg.season_id,
            team_id: reg.team_id,
            steam_id: reg.captain_steam_id
          })
          .update({ is_captain: true });
      } else {
        console.error(
          `No existing SeasonTeamPlayers row for captain ${reg.captain_steam_id} in season ${reg.season_id}, team ${reg.team_id}`
        );
      }
    }

    if (reg.co_captain_steam_id) {
      const existingPlayer = await knex("SeasonTeamPlayers")
        .where({
          season_id: reg.season_id,
          team_id: reg.team_id,
          steam_id: reg.co_captain_steam_id
        })
        .first();

      if (existingPlayer) {
        await knex("SeasonTeamPlayers")
          .where({
            season_id: reg.season_id,
            team_id: reg.team_id,
            steam_id: reg.co_captain_steam_id
          })
          .update({ is_co_captain: true });
      } else {
        console.error(
          `No existing SeasonTeamPlayers row for co-captain ${reg.co_captain_steam_id} in season ${reg.season_id}, team ${reg.team_id}`
        );
      }
    }
  }

  const allRegistrationsSeason16 = await knex("SeasonTeamRegistrations").where(
    "season_id",
    16
  );
  for (const reg of allRegistrationsSeason16) {
    const allPlayersFromSeasonTeamPlayers = await knex(
      "SeasonTeamPlayers"
    ).where({
      season_id: reg.season_id,
      team_id: reg.team_id
    });
    for (const player of allPlayersFromSeasonTeamPlayers) {
      await knex("SeasonTeamRegistrationPlayers").insert({
        season_id: reg.season_id,
        team_id: player.team_id,
        steam_id: player.steam_id,
        is_captain: reg.captain_steam_id === player.steam_id,
        is_co_captain: reg.co_captain_steam_id === player.steam_id
      });
    }
  }

  // After migration, drop captain columns from old table
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.dropForeign("captain_steam_id");
    table.dropForeign("co_captain_steam_id");

    table.dropColumn("captain_steam_id");
    table.dropColumn("co_captain_steam_id");
  });
  await knex.schema.alterTable("SeasonLeagueTeams", (table) => {
    table.dropForeign(["season_id", "team_id"]);
  });
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropForeign(["season_id", "team_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Reverse alterations
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropColumn("is_captain");
    table.dropColumn("is_co_captain");
  });
  await knex.schema.dropTableIfExists("SeasonTeamRegistrationPlayers");

  // Restore old columns (simplified)
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.bigInteger("captain_steam_id").nullable();
    table.bigInteger("co_captain_steam_id").nullable();
  });
}
