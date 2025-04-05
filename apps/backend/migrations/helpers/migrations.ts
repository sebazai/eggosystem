/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { runOldDbQuery, runNewDbQuery } from "./migrationsDbConnections";

const trimTeamName = (teamName: string) => {
  return teamName.trim().toLowerCase().replaceAll(/\s/g, "");
};

const fixYTunnus = (ytunnus: string) => {
  const replacedYTunnus = ytunnus
    .replaceAll(/\s/g, "")
    .replace(/^FI/, "")
    .replace(/^Y-tunnus/, "")
    .replace(/^1234567-8/, "")
    .replace(/\./, "")
    .replace(/–/, "-");
  if (!replacedYTunnus.includes("-")) {
    return replacedYTunnus.slice(0, -1) + "-" + replacedYTunnus.slice(-1);
  }
  return replacedYTunnus;
};

export const migrateCompanies = async () => {
  console.log("Migrating companies");
  // Use these tables to fetch possible companydata.
  const queries = [
    "SELECT * FROM teamsbuild GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s11 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s12 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s13 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s14 GROUP BY yrityksen_y_tunnus"
  ];

  const allCompanies = (
    await Promise.all(queries.map((query) => runOldDbQuery(query)))
  ).flat();

  const allCompaniesCleanedYTunnus: any[] = allCompanies.map((company: any) => {
    const company_code = company.yrityksen_y_tunnus;
    return {
      ...company,
      yrityksen_y_tunnus: fixYTunnus(company_code)
    };
  });

  const uniqueCompaniesByYtunnus = allCompaniesCleanedYTunnus.filter(
    (company: any, index: number, self: any) =>
      index ===
      self.findIndex(
        (t: any) => t.yrityksen_y_tunnus === company.yrityksen_y_tunnus
      )
  );

  const cleanWWWPage = (url: string) => {
    const trimmedUrl = url.trim().toLowerCase();
    if (trimmedUrl.startsWith("www")) {
      // Remove www. and add https://
      const newUrl = trimmedUrl.replace("www.", "https://");
      return newUrl;
    }
    // if trimmed url starts with http://www. or https://www. remove www. return
    if (
      trimmedUrl.startsWith("http://www.") ||
      trimmedUrl.startsWith("https://www.")
    ) {
      return trimmedUrl.replace("www.", "");
    }
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const insertUniqueCompaniesQueries = uniqueCompaniesByYtunnus.map(
    (company: any) => {
      if (company.yrityksen_y_tunnus === "-") {
        return null;
      }

      return `INSERT INTO Organizations (name, country, organization_code, logo, website) VALUES ('${company.yritys}', 'Finland', '${company.yrityksen_y_tunnus}', 'nologo.svg', '${cleanWWWPage(company.yrityksen_internet_sivut)}');`;
    }
  );

  for (const query of insertUniqueCompaniesQueries) {
    if (query) {
      await runNewDbQuery(query);
    }
  }
  console.log("Companies migrated");
};

export const migrateAlmostErrything = async () => {
  const teams: any[] = await runOldDbQuery("SELECT * FROM teams");

  const newLeagues = await runNewDbQuery<any>("SELECT * FROM SeasonLeagues");

  const newLeaguesByOldKanaLeagueIdToSeasonId: any = newLeagues.reduce(
    (acc: any, obj: any) => {
      acc[obj.old_kana_league_id] = obj.season_id;
      return acc;
    },
    {}
  );

  const newLeaguesByOldKanaLeagueIdToNewLeagueId: any = newLeagues.reduce(
    (acc: any, obj: any) => {
      acc[obj.old_kana_league_id] = obj.league_id;
      return acc;
    },
    {}
  );

  // Use these tables to fetch possible companydata.
  const queries = [
    "SELECT * FROM teamsbuild GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s11 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s12 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s13 GROUP BY yrityksen_y_tunnus",
    "SELECT * FROM teamsbuild_s14 GROUP BY yrityksen_y_tunnus"
  ];

  const allTeambuilderCompanies = (
    await Promise.all(queries.map((query) => runOldDbQuery(query)))
  ).flat();

  const teambuilderCompaniesByTeamName: any = allTeambuilderCompanies.reduce(
    (acc: any, obj: any) => {
      const company_code = obj.yrityksen_y_tunnus;

      const trimmedName = trimTeamName(obj.Name);
      if (acc[trimmedName]) {
        return acc;
      }
      acc[trimTeamName(obj.Name)] = {
        ...obj,
        yrityksen_y_tunnus: fixYTunnus(company_code)
      };
      return acc;
    },
    {}
  );

  const newCompanies = await runNewDbQuery<any>("SELECT * FROM Organizations");

  const newCompaniesByCompanyCode: any = newCompanies.reduce(
    (acc: any, obj: any) => {
      acc[obj.organization_code] = obj;
      return acc;
    },
    {}
  );

  // Get all players from old db
  const oldPlayers = await runOldDbQuery<any>(
    "SELECT * FROM players ORDER BY id ASC"
  );

  // Players by steamID, we shoould have the latest/freshest objective per steam id due to ordering by id ASC
  const oldPlayersReducedSteamId: any = oldPlayers.reduce(
    (acc: any, obj: any) => {
      acc[obj.steamID] = obj;
      return acc;
    },
    {}
  );

  const oldPlayersReducedToId: any = oldPlayers.reduce((acc: any, obj: any) => {
    acc[obj.id] = obj;
    return acc;
  }, {});

  // teamId to all players in the team steamID
  const teamIdAllPlayersInTeam: any = oldPlayers.reduce(
    (acc: any, obj: any) => {
      // If the team ID doesn't exist yet, initialize it as an empty array
      if (!acc[obj.teamId]) {
        acc[obj.teamId] = [];
      }
      // Add the player to the corresponding team
      acc[obj.teamId].push(obj.steamID);
      return acc;
    },
    {}
  );

  const teamIdAllPlayersInTeamById: any = oldPlayers.reduce(
    (acc: any, obj: any) => {
      if (!acc[obj.teamId]) {
        acc[obj.teamId] = [];
      }
      // Add the player to the corresponding team
      acc[obj.teamId].push(obj.id);
      return acc;
    },
    {}
  );

  console.log("Migrating teams");
  for (const team of teams) {
    const teamId = team.id;
    const teamName = trimTeamName(team.Name);
    const teamLeague = newLeaguesByOldKanaLeagueIdToNewLeagueId[team.leagueID];

    const teamSeason = newLeaguesByOldKanaLeagueIdToSeasonId[team.leagueID];

    const team_company_logo = team.logo;

    // Get all steamIds in team
    const playersSteamIdsArray = teamIdAllPlayersInTeam[teamId];

    // Insert players into new db if they don't exist
    for (const steamId of playersSteamIdsArray) {
      const player = oldPlayersReducedSteamId[steamId];
      const query = `INSERT IGNORE INTO Players (steam_id, name, email, player_name, work_email) VALUES (?, ?, ?, ?, ?);`;
      await runNewDbQuery(query, [
        player.steamID,
        player.name,
        player.email,
        player.pelaajan_nimi,
        player.work_email
      ]);
    }

    // Did we find an equivalent from teambuilding tables
    const teamCompany = teambuilderCompaniesByTeamName[teamName];

    // if teamname is found in teambuilder season 11-14, we should find a company for it due to past migration
    if (teamCompany) {
      const newCompany =
        newCompaniesByCompanyCode[teamCompany.yrityksen_y_tunnus];

      console.log(
        "Found company for,",
        teamName,
        "company name",
        teamCompany.Name,
        "with y-tunnus,",
        newCompany?.organization_code,
        "and id,",
        newCompany?.id
      );
      const emailToAddForTeam =
        team.email === "noreply@kanaliiga.fi" ? teamCompany.email : team.email;

      const query = `INSERT INTO Teams (id, organization_id, name, team_logo, email) VALUES (?, ?, ?, ?, ?);`;
      await runNewDbQuery(query, [
        teamId,
        newCompany?.id ?? null,
        team.Name,
        team_company_logo,
        emailToAddForTeam
      ]);

      const addTeamToSeasonQuery = `INSERT INTO SeasonTeamRegistrations (season_id, team_id) VALUES (?, ?);`;
      await runNewDbQuery(addTeamToSeasonQuery, [teamSeason, teamId]);
    }

    if (!teamCompany) {
      console.log("No company found for team", teamName);
      const query = `INSERT INTO Teams (id, name, team_logo, email) VALUES (?, ?, ?, ?);`;
      await runNewDbQuery(query, [
        teamId,
        team.Name,
        team_company_logo,
        team.email
      ]);
      const addTeamToSeasonQuery = `INSERT INTO SeasonTeamRegistrations (season_id, team_id) VALUES ('${teamSeason}', '${teamId}');`;
      await runNewDbQuery(addTeamToSeasonQuery);
    }

    const seasonTeamLeagueQuery = `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id) VALUES ('${teamSeason}', '${teamId}', '${teamLeague}');`;
    await runNewDbQuery(seasonTeamLeagueQuery);

    const playersIdsArray = teamIdAllPlayersInTeamById[teamId];

    for (const id of playersIdsArray) {
      const player = oldPlayersReducedToId[id];
      const role = player.isSub ? "substitute" : "primary";
      const seasonTeamPlayersQuery = `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role) VALUES ('${teamSeason}', '${teamId}', '${player.steamID}', '${role}');`;
      await runNewDbQuery(seasonTeamPlayersQuery);
    }
  }
  await runNewDbQuery("UPDATE Teams SET name = LTRIM(RTRIM(name));");
  console.log("Teams migrated");

  console.log("Getting capitans for season 11-14");
  const seasonTeamsRegistrations = await runNewDbQuery<any>(
    "SELECT st.season_id, st.team_id, t.name FROM SeasonTeamRegistrations st INNER JOIN Teams t ON st.team_id = t.id WHERE st.season_id IN (11, 12, 13, 14)"
  );
  for (const st of seasonTeamsRegistrations) {
    const teamName = st.name;
    const seasonId = st.season_id;
    const registrationID = await runOldDbQuery<any>(
      `SELECT registrationID FROM teamsbuild_s${seasonId} WHERE LOWER(Name) = LOWER(?)`,
      [teamName]
    );
    if (registrationID.length !== 0) {
      try {
        await runNewDbQuery(
          `UPDATE SeasonTeamRegistrations SET captain_steam_id = ${registrationID[0].registrationID} WHERE season_id = ${seasonId} AND team_id = ${st.team_id}`
        );
      } catch (_error) {
        console.log(
          "Error updating captain for team",
          teamName,
          "with registrationID",
          registrationID
        );
      }
    } else {
      console.log("No captain found for team", teamName);
      const registrationID = await runOldDbQuery<any>(
        `SELECT registrationID FROM teamsbuild WHERE LOWER(Name) = LOWER(?)`,
        [teamName]
      );
      if (registrationID.length !== 0) {
        try {
          await runNewDbQuery(
            `UPDATE SeasonTeamRegistrations SET captain_steam_id = ${registrationID[0].registrationID} WHERE season_id = 15 AND team_id = ${st.team_id}`
          );
        } catch (_error) {
          console.log(
            "Error updating captain for team",
            teamName,
            "with registrationID",
            registrationID
          );
        }
      }
    }
  }
};

const migrateMatchCrazy = async (
  match: any,
  newParentMatchId: number,
  t_team_id: string,
  ct_team_id: string
) => {
  const mapId = await runNewDbQuery<any>("SELECT id FROM Maps WHERE name = ?", [
    match.map
  ]);
  const matchMapPlayedQuery = `INSERT INTO MatchGames (id, match_id, map_id, demofile) VALUES (?, ?, ?, ?);`;
  await runNewDbQuery(matchMapPlayedQuery, [
    match.id,
    newParentMatchId,
    mapId[0].id,
    match.demofile
  ]);

  const MatchTeamGameScoresInsert = `INSERT INTO TeamGameScores (match_id, team_id, game_id, score, halftime_score, overtime_score, starting_side) VALUES (?, ?, ?, ?, ?, ?, ?);`;
  await runNewDbQuery(MatchTeamGameScoresInsert, [
    newParentMatchId,
    t_team_id,
    match.id,
    match.team1Score,
    match.team1HTScore,
    match.team1OTScore,
    "T"
  ]);
  await runNewDbQuery(MatchTeamGameScoresInsert, [
    newParentMatchId,
    ct_team_id,
    match.id,
    match.team2Score,
    match.team2HTScore,
    match.team2OTScore,
    "CT"
  ]);

  const allOldMatchStats: any[] = await runOldDbQuery(
    "SELECT * FROM afterplant WHERE matchID = ?",
    [match.id]
  );
  const MatchMapRoundStatsInsert = `INSERT INTO MapRoundStats (id, game_id, ct_team_id, t_team_id, round_number, round_end_reason_info, ct_t, first_kill, plant_site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
  for (const round of allOldMatchStats) {
    const plantSite =
      round.Site === "A" ? "A" : round.Site === "B" ? "B" : null;
    const ct_T_parsed = plantSite ? round.CT_T : null;
    await runNewDbQuery(MatchMapRoundStatsInsert, [
      round.id,
      match.id,
      round.CT_Team === 2 ? ct_team_id : t_team_id,
      round.T_Team === 1 ? t_team_id : ct_team_id,
      round.round,
      round.roundInfo,
      ct_T_parsed,
      round.firstKill,
      plantSite
    ]);
  }
};

export const migrateMatchesAndReservations = async () => {
  console.log("Migrating matches");
  // Old matches insert
  // INSERT INTO `matches`(`id`, `team1`, `team2`, `team1Score`, `team1HTScore`, `team1OTScore`, `team2Score`, `team2HTScore`, `team2OTScore`, `map`, `date`, `leagueID`, `demofile`, `type`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]','[value-11]','[value-12]','[value-13]','[value-14]')
  const allOldMatches: any[] = await runOldDbQuery("SELECT * FROM matches");

  const newLeagues = await runNewDbQuery<any>("SELECT * FROM SeasonLeagues");

  const newLeaguesByOldKanaLeagueIdToSeasonId: any = newLeagues.reduce(
    (acc: any, obj: any) => {
      acc[obj.old_kana_league_id] = obj.season_id;
      return acc;
    },
    {}
  );

  const newLeaguesByOldKanaLeagueIdToNewLeagueId: any = newLeagues.reduce(
    (acc: any, obj: any) => {
      acc[obj.old_kana_league_id] = obj.league_id;
      return acc;
    },
    {}
  );

  // This contains all matches id's that have been migrated, i.e. if type=2 we might migrate match.id's earlier than they arrive in for loop
  const matchMapsPlayedAlreadyMigratedIds = new Set();

  for (const match of allOldMatches) {
    const matchSeasonId = newLeaguesByOldKanaLeagueIdToSeasonId[match.leagueID];
    const matchLeagueId =
      newLeaguesByOldKanaLeagueIdToNewLeagueId[match.leagueID];

    // If one old match has been migrated, we don't want to migrate it again, i.e. if one match of a BO3 has been migrated, we know that all other one the same date the matches were played has been migrated, we can skip.
    if (matchMapsPlayedAlreadyMigratedIds.has(match.id)) {
      console.log("Continuing, match already migrated", match.id);
      continue;
    }

    // Insert PARENT match that contains all bo1, bo3
    const matchQuery = `INSERT INTO Matches (season_id, league_id, stage, best_of, match_date) VALUES (?, ?, ?, ?, ?);`;
    const parentMatch = await runNewDbQuery<{ insertId: number }>(matchQuery, [
      matchSeasonId,
      matchLeagueId,
      match.type,
      match.best_of,
      match.date
    ]);
    const newParentMatchId = parentMatch.insertId;

    const insertMatchteams = `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id) VALUES (?, ?, ?, ?);`;
    const t_team_id = match.team1;
    const ct_team_id = match.team2;
    await runNewDbQuery(insertMatchteams, [
      newParentMatchId,
      t_team_id,
      matchSeasonId,
      matchLeagueId
    ]);
    await runNewDbQuery(insertMatchteams, [
      newParentMatchId,
      ct_team_id,
      matchSeasonId,
      matchLeagueId
    ]);

    // Ensure all maps exists...
    const checkIfMapWithNameExists = `SELECT * FROM Maps WHERE name = ?;`;
    const mapExists = await runNewDbQuery<any>(checkIfMapWithNameExists, [
      match.map
    ]);
    if (mapExists.length === 0) {
      const insertMapIfNotExistsQuery = `INSERT INTO Maps (name) VALUES (?);`;
      await runNewDbQuery(insertMapIfNotExistsQuery, [match.map]);
    }

    // Insert this match
    await migrateMatchCrazy(match, newParentMatchId, t_team_id, ct_team_id);
    matchMapsPlayedAlreadyMigratedIds.add(match.id);

    if (match.best_of === 3) {
      console.log(
        "Match is best of 3, let's migrate all other matches played on the same date between the same teams"
      );
      // Select all other matches played between the teams on the same date for the same league, except this match
      const allOtherBestOfMatchesQuery = `SELECT * FROM matches WHERE ((team1 = '${match.team1}' AND team2 = '${match.team2}') OR (team1 = '${match.team2}' AND team2 = '${match.team1}')) AND date = '${match.date}' AND leagueID = '${match.leagueID}' AND best_of = 3 AND id NOT IN (${match.id});`;

      console.log("Query", allOtherBestOfMatchesQuery);

      const matchesPlayedOnSameDateBetweenSameTeams: any[] =
        await runOldDbQuery(allOtherBestOfMatchesQuery);
      console.log(
        "Found matches that weren't migrated",
        matchesPlayedOnSameDateBetweenSameTeams.length
      );
      for (const matchPlayed of matchesPlayedOnSameDateBetweenSameTeams) {
        console.log(
          "Migrating match that wasn't migrated, ",
          matchPlayed.id,
          "parent, ",
          newParentMatchId
        );

        const t_team_id_other = matchPlayed.team1;
        const ct_team_id_other = matchPlayed.team2;

        await migrateMatchCrazy(
          matchPlayed,
          newParentMatchId,
          t_team_id_other,
          ct_team_id_other
        );
        matchMapsPlayedAlreadyMigratedIds.add(matchPlayed.id);
      }
    }
  }

  console.log("Matches migrated");
  const allOldReservations: any[] = await runOldDbQuery(
    "SELECT * FROM reservations"
  );

  // Old reservations insert
  // INSERT INTO `reservations`(`id`, `serverID`, `date`, `team1`, `team2`, `dateEnd`, `stream`, `hash`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]')

  // New reservations insert
  // INSERT INTO `MatchReservations`(`id`, `match_id`, `dateStart`, `dateEnd`, `steam_url`, `hash`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]')

  console.log("Migrating reservations");
  // set ID into hashmap
  for (const reservation of allOldReservations) {
    const query = `INSERT IGNORE INTO Reservations (id, date_start, date_end, stream_url, hash, team1_id, team2_id) VALUES (?, ?, ?, ?, ?, ?, ?);`;
    await runNewDbQuery(query, [
      reservation.id,
      reservation.date,
      reservation.dateEnd,
      reservation.stream,
      reservation.hash,
      reservation.team1,
      reservation.team2
    ]);
    const reservationDate = new Date(reservation.date)
      .toISOString()
      .split("T")[0];
    const foundMatchesIds: any[] = await runNewDbQuery(
      `SELECT mt1.match_id
        FROM MatchTeams mt1
        JOIN MatchTeams mt2 ON mt1.match_id = mt2.match_id
        JOIN Matches m ON mt1.match_id = m.id
        WHERE mt1.team_id = ${reservation.team1}
        AND mt2.team_id = ${reservation.team2}
        AND m.match_date = '${reservationDate}';`
    );

    for (const match of foundMatchesIds) {
      const matchId = match.match_id;
      const reservationId = reservation.id;
      const query = `INSERT INTO MatchReservations (match_id, reservation_id) VALUES (?, ?);`;
      await runNewDbQuery(query, [matchId, reservationId]);
    }
  }

  console.log("Matches and reservations migrated");
};

export const migrateRanks = async () => {
  console.log("Migrating ranks");
  const allOldRanks: any[] = await runOldDbQuery("SELECT * FROM ranks");

  // oldRanks table insert
  // INSERT INTO `ranks`(`steamID`, `rank`, `oldrank`, `cs2rank`, `level`, `kukkoDate`, `faceDate`, `hours`, `faceELO`, `kanaelo`, `fkd`, `ekd`, `esportalElo`, `esportalRank`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]','[value-11]','[value-12]','[value-13]','[value-14]')

  // newRanks table insert
  // INSERT INTO `Ranks`(`steam_id`, `season_id`, `kukko_date`, `csgo_rank`, `cs2_rank`, `cs_hours`, `faceit_level`, `faceit_elo`, `faceit_kd`, `faceit_date`, `kana_elo`, `esportal_kd`, `esportal_elo`, `esportal_rank`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]','[value-11]','[value-12]','[value-13]','[value-14]')

  for (const rank of allOldRanks) {
    const query = `INSERT INTO SeasonPlayerRanks (steam_id, season_id, kukko_date, csgo_rank, cs2_rank, cs_hours, faceit_level, faceit_elo, faceit_kd, faceit_date, kana_elo, esportal_kd, esportal_elo, esportal_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    await runNewDbQuery(query, [
      rank.steamID,
      "14",
      rank.kukkoDate,
      rank.rank,
      rank.cs2rank,
      rank.hours,
      rank.level,
      rank.faceELO,
      rank.fkd,
      rank.faceDate,
      rank.kanaelo,
      rank.ekd,
      rank.esportalElo,
      rank.esportalRank
    ]);
  }
  console.log("Ranks migrated");
};

export const migratePlayerStats = async () => {
  console.log("Migrating player stats");
  const oldPlayerStats: any[] = await runOldDbQuery(
    "SELECT * FROM stats_all_seasons"
  );

  for (const playerStat of oldPlayerStats) {
    const newPlayerStatsInsertQuery =
      "INSERT INTO PlayerStats(`id`, `steam_id`, `game_id`, `team`, `kills`, `deaths`, `assists`, `assists_ct`, `assists_t`, `mvps`, `total_damage`, `total_damage_ct`, `total_damage_t`, `headshots`, `flash_assists`, `flash_assists_t`, `flash_assists_ct`, `adr`, `adr_t`, `adr_ct`, `hs_percent`, `plants`, `explodes`, `defuses`, `first_kills`, `kills_1`, `kills_2`, `kills_3`, `kills_4`, `kills_5`, `trades`, `traded`, `clutches_won`, `clutches`, `awp_kills`, `utility_damage`, `utility_damage_t`, `utility_damage_ct`, `molotov_damage`, `molotov_damage_ct`, `molotov_damage_t`, `he_damage`, `he_damage_ct`, `he_damage_t`, `trade_attempts`, `trade_attempts_ct`, `trade_attempts_t`, `kills_through_walls`, `first_death_trade_attempts`, `first_death_trade_attempts_ct`, `first_death_trade_attempts_t`, `first_death_trade_opportunities`, `first_death_trade_opportunities_ct`, `first_death_trade_opportunities_t`, `trade_opportunities`, `trade_opportunities_t`, `trade_opportunities_ct`, `flashes_thrown`, `enemies_flashed`, `mates_flashed`, `self_flashes`, `first_deaths`, `total_mf_duration`, `total_ef_duration`, `one_v_one_won`, `one_v_one_lost`, `one_v_one_won_ct`, `one_v_one_lost_ct`, `one_v_one_won_t`, `one_v_one_lost_t`, `kast`, `kana_rating`, `first_kills_t`, `first_kills_ct`, `first_deaths_t`, `first_deaths_ct`, `first_death_trades`, `first_death_traded`, `first_death_trades_ct`, `first_death_traded_ct`, `first_death_trades_t`, `first_death_traded_t`, `flashes_thrown_t`, `flashes_thrown_ct`, `enemies_flashed_t`, `enemies_flashed_ct`, `kills_t`, `kills_ct`, `deaths_t`, `deaths_ct`, `trades_t`, `trades_ct`, `traded_t`, `traded_ct`, `total_ef_duration_ct`, `total_ef_duration_t`, `total_mf_duration_t`, `total_mf_duration_ct`, `mates_flashed_t`, `mates_flashed_ct`, `ttd`, `crosshair_placement`, `ttf`, `rws`, `shots`, `shots_hit`, `total_strafing_shots`, `good_strafing_shots`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await runNewDbQuery(newPlayerStatsInsertQuery, [
      playerStat.id,
      playerStat.steamID,
      playerStat.matchID,
      playerStat.Team,
      playerStat.Kills,
      playerStat.Deaths,
      playerStat.Assists,
      playerStat.Assists_CT,
      playerStat.Assists_T,
      playerStat.MVPs,
      playerStat.TotalDamage,
      playerStat.TotalDamage_CT,
      playerStat.TotalDamage_T,
      playerStat.Headshots,
      playerStat.FlashAssists,
      playerStat.FlashAssists_T,
      playerStat.FlashAssists_CT,
      playerStat.ADR,
      playerStat.ADR_T,
      playerStat.ADR_CT,
      playerStat.HSPercent,
      playerStat.Plants,
      playerStat.Explodes,
      playerStat.Defuses,
      playerStat.FirstKills,
      playerStat.Kills1,
      playerStat.Kills2,
      playerStat.Kills3,
      playerStat.Kills4,
      playerStat.Kills5,
      playerStat.Trades,
      playerStat.Traded,
      playerStat.ClutchesWon,
      playerStat.Clutches,
      playerStat.AWPKills,
      playerStat.UtilityDamage,
      playerStat.UtilityDamage_T,
      playerStat.UtilityDamage_CT,
      playerStat.MolotovDamage,
      playerStat.MolotovDamage_CT,
      playerStat.MolotovDamage_T,
      playerStat.HEDamage,
      playerStat.HEDamage_CT,
      playerStat.HEDamage_T,
      playerStat.TradeAttempts,
      playerStat.TradeAttempts_CT,
      playerStat.TradeAttempts_T,
      playerStat.KillsThroughWalls,
      playerStat.FirstDeathTradeAttempts,
      playerStat.FirstDeathTradeAttempts_CT,
      playerStat.FirstDeathTradeAttempts_T,
      playerStat.FirstDeathTradeOppoturnities,
      playerStat.FirstDeathTradeOppoturnities_CT,
      playerStat.FirstDeathTradeOppoturnities_T,
      playerStat.TradeOppoturnities,
      playerStat.TradeOppoturnities_T,
      playerStat.TradeOppoturnities_CT,
      playerStat.FlashesThrown,
      playerStat.EnemiesFlashed,
      playerStat.MatesFlashed,
      playerStat.SelfFlashes,
      playerStat.FirstDeaths,
      playerStat.TotalMFDuration,
      playerStat.TotalEFDuration,
      playerStat.OneVoneWon,
      playerStat.OneVoneLost,
      playerStat.OneVoneWon_CT,
      playerStat.OneVoneLost_CT,
      playerStat.OneVoneWon_T,
      playerStat.OneVoneLost_T,
      playerStat.KAST,
      playerStat.kanaRating,
      playerStat.FirstKills_T,
      playerStat.FirstKills_CT,
      playerStat.FirstDeaths_T,
      playerStat.FirstDeaths_CT,
      playerStat.FirstDeath_Trades,
      playerStat.FirstDeath_Traded,
      playerStat.FirstDeath_Trades_CT,
      playerStat.FirstDeath_Traded_CT,
      playerStat.FirstDeath_Trades_T,
      playerStat.FirstDeath_Traded_T,
      playerStat.FlashesThrown_T,
      playerStat.FlashesThrown_CT,
      playerStat.EnemiesFlashed_T,
      playerStat.EnemiesFlashed_CT,
      playerStat.Kills_T,
      playerStat.Kills_CT,
      playerStat.Deaths_T,
      playerStat.Deaths_CT,
      playerStat.Trades_T,
      playerStat.Trades_CT,
      playerStat.Traded_T,
      playerStat.Traded_CT,
      playerStat.TotalEFDuration_CT,
      playerStat.TotalEFDuration_T,
      playerStat.TotalMFDuration_T,
      playerStat.TotalMFDuration_CT,
      playerStat.MatesFlashed_T,
      playerStat.MatesFlashed_CT,
      playerStat.TTD,
      playerStat.CrosshairPlacement,
      playerStat.TTF,
      playerStat.RWS,
      playerStat.Shots,
      playerStat.ShotsHit,
      playerStat.TotalStrafingShots,
      playerStat.GoodStrafingShots
    ]);
  }
  console.log("Player stats migrated");
};

export const migrateTrades = async () => {
  console.log("Migrating trades, hold on...");
  const allOldTrades: any[] = await runOldDbQuery("SELECT * FROM trades");
  // Old Trades insert
  // INSERT INTO `trades`(`id`, `matchID`, `RoundNumber`, `Trader`, `Victim`, `Killer`, `FirstDeath`, `Traded`, `Attempted`, `Time`, `TradeTime`, `DeathTime`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]','[value-11]','[value-12]')

  // new Trades insert
  // INSERT INTO `Trades`(`id`, `match_id`, `trader_steam_id`, `killer_steam_id`, `victim_steam_id`, `round_number`, `first_death`, `traded`, `attempted`, `time`, `trade_time`, `death_time`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]','[value-11]','[value-12]')

  for (const trade of allOldTrades) {
    const query = `INSERT INTO PlayerTrades (id, game_id, trader_steam_id, killer_steam_id, victim_steam_id, round_number, first_death, traded, attempted, time, trade_time, death_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    await runNewDbQuery(query, [
      trade.id,
      trade.matchID,
      trade.Trader,
      trade.Victim,
      trade.Killer,
      trade.RoundNumber,
      trade.FirstDeath,
      trade.Traded,
      trade.Attempted,
      trade.Time,
      trade.TradeTime,
      trade.DeathTime
    ]);
  }
  console.log("Trades migrated");
};

// export const migrateMatchStats = async () => {
//   // old afterplant insert
//   // INSERT INTO `afterplant`(`id`, `matchID`, `round`, `CT_T`, `CT_Team`, `T_Team`, `firstKill`, `winner`, `Site`, `roundInfo`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]')

//   // New MatchStats insert
//   // INSERT INTO `MatchStats`(`id`, `match_id`, `round_number`, `ct_t`, `ct_team`, `t_team`, `first_kill`, `winner`, `plant_site`, `round_info`) VALUES ('[value-1]','[value-2]','[value-3]','[value-4]','[value-5]','[value-6]','[value-7]','[value-8]','[value-9]','[value-10]')
//   console.log('Migrating MatchStats, just sit back and relax...');
// const allOldMatchStats: any[] = await runOldDbQuery('SELECT * FROM afterplant');
// const MatchMapRoundStatsInsert = `INSERT INTO MapRoundStats (game_id, ct_team_id, t_team_id, round_number, round_end_reason_info, ct_t, first_kill, winner, plant_site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
// for (const round of allOldMatchStats) {
//   // const matchMapPlayed = await runNewDbQuery<any>(
//   //   'SELECT  FROM MatchGames mmp JOIN MatchTeams mt ON mt.match_id = mmp.match_id WHERE id = ?',
//   //   [round.matchID]
//   // );
//   await runNewDbQuery(MatchMapRoundStatsInsert, [
//     round.matchID,
//     // round.CT_Team === 2 ? ct_team_id : t_team_id,
//     // round.T_Team === 1 ? t_team_id : ct_team_id,
//     round.CT_Team,
//     round.T_Team,
//     round.round,
//     round.roundInfo,
//     round.CT_T,
//     round.firstKill,
//     round.winner,
//     round.Site,
//   ]);
// }
// };

export const teamLogosToCompanies = async () => {
  const teamNameOk = new Set();
  console.log("Fixing logos for teams and companies");
  const allTeams = await runNewDbQuery<any[]>("SELECT * FROM Teams");
  for (const team of allTeams) {
    if (teamNameOk.has(team.name)) {
      console.log("Skipping team, already fixed ", team.name);
      continue;
    }
    const allTeamsWithSameName = await runNewDbQuery<any[]>(
      "SELECT * FROM Teams WHERE name = ? ORDER BY id DESC",
      [team.name]
    );
    console.log(
      "Found",
      allTeamsWithSameName.length,
      "teams with name",
      team.name
    );
    const findLatestTeamWithLogo = allTeamsWithSameName.find((t) => {
      const pattern = /^S\d\d/;
      return pattern.test(t.team_logo);
    });
    if (findLatestTeamWithLogo) {
      console.log(
        "Found logo for team",
        team.name,
        findLatestTeamWithLogo.team_logo
      );
      const logo = findLatestTeamWithLogo.team_logo;
      for (const t of allTeamsWithSameName) {
        if (t.organization_id) {
          console.log(
            "This team has an organization id",
            t.organization_id,
            "update logo to",
            logo
          );
          const updateOrgLogo = `UPDATE Organizations SET logo = ? WHERE id = ?;`;
          await runNewDbQuery(updateOrgLogo, [logo, t.organization_id]);
        }
        const query = `UPDATE Teams SET team_logo = ? WHERE id = ?;`;
        await runNewDbQuery(query, [logo, t.id]);
      }
    }
    teamNameOk.add(team.name);
  }
};

export const cleanTeamsWithCascade = async () => {
  console.log("Cleaning duplicate teams with cascade");
  // First query to find teams with duplicate names
  const selectQuery = `
    SELECT MIN(id) AS oldest_id, name
    FROM Teams
    GROUP BY name
    HAVING COUNT(*) > 1;
  `;

  const results = await runNewDbQuery<any>(selectQuery);

  // If there are any duplicate teams, update and delete accordingly
  if (results.length > 0) {
    // Update query to update team_id in SeasonTeams
    const updateQuery = `
      UPDATE SeasonTeamRegistrations st
      JOIN Teams t_old ON st.team_id = t_old.id
      JOIN (
        SELECT MIN(id) AS oldest_id, name
        FROM Teams
        GROUP BY name
        HAVING COUNT(*) > 1
      ) t_new ON t_old.name = t_new.name AND t_old.id != t_new.oldest_id
      SET st.team_id = t_new.oldest_id;
    `;
    const updateMapRoundStatsCt = `
      UPDATE MapRoundStats st
      JOIN Teams t_old ON st.ct_team_id = t_old.id
      JOIN (
        SELECT MIN(id) AS oldest_id, name
        FROM Teams
        GROUP BY name
        HAVING COUNT(*) > 1
      ) t_new ON t_old.name = t_new.name AND t_old.id != t_new.oldest_id
      SET st.ct_team_id = t_new.oldest_id;
    `;
    const updateMapRoundStatsT = `
      UPDATE MapRoundStats st
      JOIN Teams t_old ON st.t_team_id = t_old.id
      JOIN (
        SELECT MIN(id) AS oldest_id, name
        FROM Teams
        GROUP BY name
        HAVING COUNT(*) > 1
      ) t_new ON t_old.name = t_new.name AND t_old.id != t_new.oldest_id
      SET st.t_team_id = t_new.oldest_id;
    `;
    await runNewDbQuery(updateQuery);
    await runNewDbQuery(updateMapRoundStatsCt);
    await runNewDbQuery(updateMapRoundStatsT);

    // Delete query to remove duplicate teams
    const deleteQuery = `
      DELETE t
      FROM Teams t
      LEFT JOIN (
        SELECT MIN(id) AS oldest_id, name
        FROM Teams
        GROUP BY name
      ) t_keep ON t.id = t_keep.oldest_id
      WHERE t_keep.oldest_id IS NULL;
    `;
    await runNewDbQuery(deleteQuery);
  }
};

export const experimentalTeamsIntoCompanies = async () => {
  console.log("Experimental teams into companies");
  const query = `SELECT * FROM Teams WHERE organization_id IS NULL;`;

  const teams: any[] = await runNewDbQuery(query);

  for (const team of teams) {
    const teamNameSplit = team.name.split(" ");
    const teamName = teamNameSplit[0];

    const likeCompanyName =
      teamName.length < 3 ? `${teamName}%` : `%${teamName}%`;
    const query = `SELECT * FROM Organizations WHERE name LIKE ?;`;
    const companies = await runNewDbQuery<any>(query, [likeCompanyName]);

    if (companies.length > 0) {
      const company: any = companies[0];
      const companyId = company.id;
      console.log("Team", team.name, "is now in company", company.name);
      const updateQuery = `UPDATE Teams SET organization_id = ? WHERE id = ?;`;
      await runNewDbQuery(updateQuery, [companyId, team.id]);
    }
  }
  console.log("Experimental teams into companies migrated");
};
