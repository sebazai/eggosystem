import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("Games", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("abbreviation", 255).notNullable();
  });
  await knex.schema.createTable("Seasons", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table
      .integer("game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Games")
      .onDelete("CASCADE");
    table.string("name", 255).notNullable();
    table.string("full_name", 255).notNullable();
    table.dateTime("signup_start_date");
    table.dateTime("signup_end_date");
    table.date("start_date").notNullable();
    table.date("end_date");
    table.string("platform", 20).notNullable();
  });
  await knex.schema.createTable("Leagues", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
  });
  await knex.schema.createTable("SeasonLeagues", (table: Knex.TableBuilder) => {
    table.integer("tier").notNullable();
    table.integer("season_id").unsigned().notNullable();
    table.integer("league_id").unsigned().notNullable();
    table.string("external_id", 255);
    table.integer("old_kana_league_id").notNullable();
    table.primary(["season_id", "league_id"]);
    table
      .foreign("season_id")
      .references("id")
      .inTable("Seasons")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("league_id")
      .references("id")
      .inTable("Leagues")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("Organizations", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("country", 255);
    table.string("organization_code", 255).unique();
    table.string("logo", 255).notNullable();
    table.string("website", 255);
  });
  await knex.schema.createTable("Teams", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table
      .integer("organization_id")
      .unsigned()
      .references("id")
      .inTable("Organizations");
    table.string("name", 255).notNullable();
    table.string("team_logo", 255);
    table.string("email", 255).notNullable();
  });

  await knex.schema.createTable("SteamPlayers", (table: Knex.TableBuilder) => {
    table.bigInteger("steam_id").primary();
    table.string("nickname", 255).notNullable();
    table.string("email", 255);
    table.string("full_name", 255);
    table.string("work_email", 255);
    table.string("discord", 255);
  });

  await knex.schema.createTable("TeamRosters", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("team_id").unsigned().notNullable();
    table.bigInteger("steam_id").notNullable();
    table
      .foreign("team_id")
      .references("id")
      .inTable("Teams")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("steam_id")
      .references("steam_id")
      .inTable("SteamPlayers")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });
  await knex.schema.createTable(
    "SeasonTeamRegistrations",
    (table: Knex.TableBuilder) => {
      table.integer("season_id").unsigned().notNullable();
      table.integer("team_id").unsigned().notNullable();
      table.bigInteger("captain_steam_id").nullable();
      table.text("defects");
      table.bigInteger("co_captain_steam_id").nullable();
      table.string("ticket", 50);
      table.boolean("approved").notNullable().defaultTo(false);
      table.boolean("notification_sent").notNullable().defaultTo(false);
      table.primary(["season_id", "team_id"]);
      table
        .foreign("season_id")
        .references("id")
        .inTable("Seasons")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("team_id")
        .references("id")
        .inTable("Teams")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("captain_steam_id")
        .references("steam_id")
        .inTable("SteamPlayers")
        .onDelete("SET NULL");
      table
        .foreign("co_captain_steam_id")
        .references("steam_id")
        .inTable("SteamPlayers")
        .onDelete("SET NULL");
    }
  );

  await knex.schema.createTable(
    "SeasonLeagueTeams",
    (table: Knex.TableBuilder) => {
      table.integer("season_id").unsigned().notNullable();
      table.integer("team_id").unsigned().notNullable();
      table.integer("league_id").unsigned().notNullable();
      table.string("external_platform_id", 255);
      table.primary(["season_id", "league_id", "team_id"]);
      table
        .foreign(["season_id", "team_id"])
        .references(["season_id", "team_id"])
        .inTable("SeasonTeamRegistrations")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign(["season_id", "league_id"])
        .references(["season_id", "league_id"])
        .inTable("SeasonLeagues")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    }
  );

  await knex.schema.createTable(
    "SeasonTeamPlayers",
    (table: Knex.TableBuilder) => {
      table.integer("season_id").unsigned().notNullable();
      table.integer("team_id").unsigned().notNullable();
      table.bigInteger("steam_id").notNullable();
      table.enum("role", ["primary", "substitute"]).notNullable();
      table.primary(["season_id", "steam_id", "team_id"]);
      table
        .foreign(["season_id", "team_id"])
        .references(["season_id", "team_id"])
        .inTable("SeasonTeamRegistrations")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("steam_id")
        .references("steam_id")
        .inTable("SteamPlayers")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    }
  );
  await knex.schema.createTable("Maps", (table: Knex.TableBuilder) => {
    table.specificType("id", "TINYINT UNSIGNED").primary();
    table.string("name", 30).notNullable().unique();
  });

  // Set auto-increment manually
  await knex.raw("ALTER TABLE Maps MODIFY id TINYINT UNSIGNED AUTO_INCREMENT;");

  await knex.schema.createTable("Matches", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("league_id").unsigned().notNullable();
    table.integer("season_id").unsigned().notNullable();
    table.specificType("stage", "TINYINT UNSIGNED").notNullable().defaultTo(2);
    table.specificType("best_of", "TINYINT UNSIGNED").notNullable();
    table.date("match_date").notNullable();
    table
      .foreign(["season_id", "league_id"])
      .references(["season_id", "league_id"])
      .inTable("SeasonLeagues")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("MatchTeams", (table: Knex.TableBuilder) => {
    table.integer("match_id").unsigned().notNullable();
    table.integer("team_id").unsigned().notNullable();
    table.integer("season_id").unsigned().notNullable();
    table.integer("league_id").unsigned().notNullable();
    table.primary(["match_id", "team_id"]);
    table
      .foreign("match_id")
      .references("id")
      .inTable("Matches")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign(["season_id", "team_id", "league_id"])
      .references(["season_id", "team_id", "league_id"])
      .inTable("SeasonLeagueTeams")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable(
    "MatchTeamMapVetoes",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.integer("match_id").unsigned().notNullable();
      table.integer("team_id").unsigned().notNullable();
      table.specificType("map_id", "TINYINT UNSIGNED").notNullable();
      table.enum("action", ["drop", "pick", "decider"]).notNullable();
      table.specificType("veto_order", "TINYINT UNSIGNED").notNullable();
      table
        .foreign(["match_id", "team_id"])
        .references(["match_id", "team_id"])
        .inTable("MatchTeams")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("map_id")
        .references("id")
        .inTable("Maps")
        .onDelete("RESTRICT");
      table.unique(["match_id", "team_id", "veto_order"]);
    }
  );
  await knex.schema.createTable("MatchGames", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("match_id").unsigned().notNullable();
    table.specificType("map_id", "TINYINT UNSIGNED").notNullable();
    table.specificType("map_order", "TINYINT UNSIGNED");
    table.string("demofile", 255).notNullable();
    table
      .foreign("match_id")
      .references("id")
      .inTable("Matches")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("map_id")
      .references("id")
      .inTable("Maps")
      .onDelete("RESTRICT");
  });

  await knex.schema.createTable(
    "TeamGameScores",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.integer("match_id").unsigned().notNullable();
      table.integer("team_id").unsigned().notNullable();
      table.integer("game_id").unsigned().notNullable();
      table.enum("starting_side", ["CT", "T"]).notNullable();
      table.specificType("score", "TINYINT UNSIGNED").notNullable();
      table.specificType("halftime_score", "TINYINT UNSIGNED").notNullable();
      table.specificType("overtime_score", "TINYINT UNSIGNED").defaultTo(0);
      table
        .foreign(["match_id", "team_id"])
        .references(["match_id", "team_id"])
        .inTable("MatchTeams")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("game_id")
        .references("id")
        .inTable("MatchGames")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    }
  );
  await knex.schema.createTable("MapRoundStats", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("game_id").unsigned().notNullable();
    table.integer("ct_team_id").unsigned().notNullable();
    table.integer("t_team_id").unsigned().notNullable();
    table.specificType("round_number", "TINYINT UNSIGNED").notNullable();
    table
      .specificType("round_end_reason_info", "TINYINT UNSIGNED")
      .notNullable();
    table.json("ct_t");
    table.string("first_kill", 2);
    table.specificType("plant_site", "CHAR(1)");

    table
      .foreign("game_id")
      .references("id")
      .inTable("MatchGames")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("ct_team_id")
      .references("id")
      .inTable("Teams")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("t_team_id")
      .references("id")
      .inTable("Teams")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");

    table.unique(["game_id", "round_number"]);
  });

  // Add check constraints via raw SQL
  await knex.raw(`
  ALTER TABLE MapRoundStats ADD CONSTRAINT chk_ct_t_if_plant_site_not_null 
  CHECK (plant_site IS NULL OR ct_t IS NOT NULL);`);

  // await knex.raw(`
  // ALTER TABLE MapRoundStats ADD CONSTRAINT chk_plant_site_if_bomb_related
  // CHECK (NOT (round_end_reason_info IN (1, 2) AND plant_site IS NULL));`);

  await knex.schema.createTable("PlayerStats", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.bigInteger("steam_id").notNullable();
    table.integer("game_id").unsigned().notNullable();
    table.integer("team").notNullable();
    table.tinyint("kills").unsigned().notNullable();
    table.tinyint("deaths").unsigned().notNullable();
    table.tinyint("assists").unsigned().notNullable();
    table.tinyint("assists_ct").unsigned().notNullable();
    table.tinyint("assists_t").unsigned().notNullable();
    table.tinyint("mvps").unsigned().notNullable();
    table.integer("total_damage").notNullable();
    table.integer("total_damage_ct").notNullable();
    table.integer("total_damage_t").notNullable();
    table.tinyint("headshots").unsigned().notNullable();
    table.tinyint("flash_assists").unsigned().notNullable();
    table.tinyint("flash_assists_t").unsigned().notNullable();
    table.tinyint("flash_assists_ct").unsigned().notNullable();
    table.decimal("adr", 4, 1).notNullable();
    table.decimal("adr_t", 4, 1);
    table.decimal("adr_ct", 4, 1);
    table.tinyint("hs_percent").unsigned().notNullable();
    table.tinyint("plants").unsigned().notNullable();
    table.tinyint("explodes").unsigned().notNullable();
    table.tinyint("defuses").unsigned().notNullable();
    table.tinyint("first_kills").unsigned().notNullable();
    table.integer("kills_1").notNullable();
    table.tinyint("kills_2").unsigned().notNullable();
    table.tinyint("kills_3").unsigned().notNullable();
    table.tinyint("kills_4").unsigned().notNullable();
    table.tinyint("kills_5").unsigned().notNullable();
    table.tinyint("trades").unsigned().notNullable();
    table.tinyint("traded").unsigned().notNullable();
    table.tinyint("clutches_won").unsigned().notNullable();
    table.tinyint("clutches").unsigned().notNullable();
    table.tinyint("awp_kills").unsigned().notNullable();
    table.integer("utility_damage").notNullable();
    table.integer("utility_damage_t").notNullable();
    table.integer("utility_damage_ct").notNullable();
    table.integer("molotov_damage").notNullable();
    table.integer("molotov_damage_ct").notNullable();
    table.integer("molotov_damage_t").notNullable();
    table.integer("he_damage").notNullable();
    table.integer("he_damage_ct").notNullable();
    table.integer("he_damage_t").notNullable();
    table.tinyint("trade_attempts").unsigned().notNullable();
    table.tinyint("trade_attempts_ct").unsigned().notNullable();
    table.tinyint("trade_attempts_t").unsigned().notNullable();
    table.tinyint("kills_through_walls").unsigned().notNullable();
    table.tinyint("first_death_trade_attempts").unsigned().notNullable();
    table.tinyint("first_death_trade_attempts_ct").unsigned().notNullable();
    table.tinyint("first_death_trade_attempts_t").unsigned().notNullable();
    table.tinyint("first_death_trade_opportunities").unsigned().notNullable();
    table
      .tinyint("first_death_trade_opportunities_ct")
      .unsigned()
      .notNullable();
    table.tinyint("first_death_trade_opportunities_t").unsigned().notNullable();
    table.tinyint("trade_opportunities").unsigned().notNullable();
    table.tinyint("trade_opportunities_t").unsigned().notNullable();
    table.tinyint("trade_opportunities_ct").unsigned().notNullable();
    table.tinyint("flashes_thrown").unsigned().notNullable();
    table.tinyint("enemies_flashed").unsigned().notNullable();
    table.tinyint("mates_flashed").unsigned().notNullable();
    table.tinyint("self_flashes").unsigned().notNullable();
    table.tinyint("first_deaths").unsigned().notNullable();
    table.decimal("total_mf_duration", 5, 1).notNullable();
    table.decimal("total_ef_duration", 5, 1).notNullable();
    table.tinyint("one_v_one_won").unsigned().notNullable();
    table.tinyint("one_v_one_lost").unsigned().notNullable();
    table.tinyint("one_v_one_won_ct").unsigned();
    table.tinyint("one_v_one_lost_ct").unsigned();
    table.tinyint("one_v_one_won_t").unsigned();
    table.tinyint("one_v_one_lost_t").unsigned();
    table.tinyint("kast").unsigned().notNullable();
    table.decimal("kana_rating", 4, 2).notNullable();
    table.tinyint("first_kills_t").unsigned();
    table.tinyint("first_kills_ct").unsigned();
    table.tinyint("first_deaths_t").unsigned();
    table.tinyint("first_deaths_ct").unsigned();
    table.tinyint("first_death_trades").unsigned().notNullable();
    table.tinyint("first_death_traded").unsigned().notNullable();
    table.tinyint("first_death_trades_ct").unsigned().notNullable();
    table.tinyint("first_death_traded_ct").unsigned().notNullable();
    table.tinyint("first_death_trades_t").unsigned().notNullable();
    table.tinyint("first_death_traded_t").unsigned().notNullable();
    table.tinyint("flashes_thrown_t").unsigned();
    table.tinyint("flashes_thrown_ct").unsigned();
    table.tinyint("enemies_flashed_t").unsigned();
    table.tinyint("enemies_flashed_ct").unsigned();
    table.tinyint("kills_t").unsigned();
    table.tinyint("kills_ct").unsigned();
    table.tinyint("deaths_t").unsigned();
    table.tinyint("deaths_ct").unsigned();
    table.tinyint("trades_t").unsigned();
    table.tinyint("trades_ct").unsigned();
    table.tinyint("traded_t").unsigned();
    table.tinyint("traded_ct").unsigned();
    table.integer("total_ef_duration_ct");
    table.integer("total_ef_duration_t");
    table.integer("total_mf_duration_t");
    table.integer("total_mf_duration_ct");
    table.tinyint("mates_flashed_t").unsigned();
    table.tinyint("mates_flashed_ct").unsigned();
    table.integer("ttd");
    table.decimal("crosshair_placement", 3, 1);
    table.integer("ttf");
    table.decimal("rws", 4, 2).notNullable();
    table.mediumint("shots").unsigned();
    table.mediumint("shots_hit").unsigned();
    table.mediumint("total_strafing_shots").unsigned();
    table.mediumint("good_strafing_shots").unsigned();

    table
      .foreign("steam_id")
      .references("SteamPlayers.steam_id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("game_id")
      .references("MatchGames.id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable(
    "SeasonPlayerRanks",
    (table: Knex.TableBuilder) => {
      table.increments("id").primary();
      table.bigInteger("steam_id").notNullable();
      table.integer("season_id").unsigned().notNullable();
      table.timestamp("kukko_date").defaultTo("1970-01-01 10:00:00");
      table.integer("csgo_rank").defaultTo(-1);
      table.integer("cs2_rank");
      table.integer("cs_hours").defaultTo(-1);
      table.integer("faceit_level");
      table.integer("faceit_elo").defaultTo(800);
      table.decimal("faceit_kd", 3, 2);
      table.timestamp("faceit_date").defaultTo("1970-01-01 10:00:00");
      table.integer("kana_elo").defaultTo(0);
      table.decimal("esportal_kd", 4, 2);
      table.integer("esportal_elo");
      table.integer("esportal_rank");

      table
        .foreign("steam_id")
        .references("SteamPlayers.steam_id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("season_id")
        .references("Seasons.id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table.unique(["steam_id", "season_id"]);
    }
  );

  await knex.schema.createTable("PlayerTrades", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.integer("game_id").unsigned().notNullable();
    table.bigInteger("trader_steam_id").notNullable();
    table.bigInteger("killer_steam_id").notNullable();
    table.bigInteger("victim_steam_id").notNullable();
    table.tinyint("round_number").unsigned().notNullable();
    table.tinyint("first_death", 1).notNullable();
    table.tinyint("traded", 1).notNullable();
    table.tinyint("attempted", 1).notNullable();
    table.bigInteger("time").unsigned();
    table.bigInteger("trade_time").unsigned();
    table.bigInteger("death_time").unsigned();

    table
      .foreign("trader_steam_id")
      .references("SteamPlayers.steam_id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("killer_steam_id")
      .references("SteamPlayers.steam_id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("victim_steam_id")
      .references("SteamPlayers.steam_id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("game_id")
      .references("MatchGames.id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("Reservations", (table: Knex.TableBuilder) => {
    table.increments("id").primary();
    table.dateTime("date_start").notNullable();
    table.dateTime("date_end").notNullable();
    table.string("stream_url", 255).notNullable();
    table.integer("team1_id").unsigned().notNullable();
    table.integer("team2_id").unsigned().notNullable();
    table.string("hash", 255).notNullable();

    table
      .foreign("team1_id")
      .references("Teams.id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    table
      .foreign("team2_id")
      .references("Teams.id")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable(
    "MatchReservations",
    (table: Knex.TableBuilder) => {
      table.integer("match_id").unsigned().notNullable();
      table.integer("reservation_id").unsigned().notNullable();
      table.primary(["match_id", "reservation_id"]);

      table
        .foreign("match_id")
        .references("Matches.id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      table
        .foreign("reservation_id")
        .references("Reservations.id")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
    }
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("Games");
  await knex.schema.dropTableIfExists("Seasons");
  await knex.schema.dropTableIfExists("Organizations");
  await knex.schema.dropTableIfExists("SeasonLeagues");
  await knex.schema.dropTableIfExists("Leagues");
  await knex.schema.dropTableIfExists("Teams");
  await knex.schema.dropTableIfExists("SteamPlayers");
  await knex.schema.dropTableIfExists("TeamRosters");
  await knex.schema.dropTableIfExists("SeasonTeamPlayers");
  await knex.schema.dropTableIfExists("SeasonLeagueTeams");
  await knex.schema.dropTableIfExists("SeasonTeamRegistrations");
  await knex.schema.dropTableIfExists("MatchTeamMapVetoes");
  await knex.schema.dropTableIfExists("MatchTeams");
  await knex.schema.dropTableIfExists("Matches");
  await knex.schema.dropTableIfExists("Maps");
  await knex.schema.dropTableIfExists("TeamGameScores");
  await knex.schema.dropTableIfExists("MatchGames");
  await knex.schema.dropTableIfExists("MapRoundStats");
  await knex.schema.dropTableIfExists("PlayerStats");
  await knex.schema.dropTableIfExists("SeasonPlayerRanks");
  await knex.schema.dropTableIfExists("PlayerTrades");
  await knex.schema.dropTableIfExists("Reservations");
  await knex.schema.dropTableIfExists("MatchReservations");
}
