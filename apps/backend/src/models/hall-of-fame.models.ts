import type {
  HallOfFameOrganization,
  HallOfFameTeam,
  HallOfFamePlayer,
  TrophyGroup
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

/**
 * Trophy points calculation:
 * Gold (1st place) = 3 points
 * Silver (2nd place) = 2 points
 * Bronze (3rd place) = 1 point
 */

interface OrgRow {
  organization_id: number;
  organization_name: string;
  organization_logo: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

interface OrgTrophyRow {
  organization_id: number;
  image_phash: string;
  trophy_name: string;
  placement: number;
  count: number;
}

interface TeamRow {
  team_id: number;
  team_name: string;
  team_logo: string | null;
  organization_id: number | null;
  organization_name: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

interface TeamTrophyRow {
  team_id: number;
  image_phash: string;
  trophy_name: string;
  placement: number;
  count: number;
}

interface PlayerRow {
  steam_id: string;
  player_name: string;
  avatar: string | null;
  gold: number;
  silver: number;
  bronze: number;
  total_points: number;
}

interface PlayerTrophyRow {
  steam_id: string;
  image_phash: string;
  trophy_name: string;
  placement: number;
  count: number;
}

/**
 * Get organizations ranked by trophy points
 * Aggregates trophies from all approved teams under each organization
 */
export const getHallOfFameOrganizations = async (
  limit: number = 50
): Promise<HallOfFameOrganization[]> => {
  // Get organization rankings
  const orgsQuery = `
    SELECT
      o.id AS organization_id,
      o.name AS organization_name,
      o.logo AS organization_logo,
      COALESCE(SUM(CASE WHEN slt.placement = 1 THEN 1 ELSE 0 END), 0) AS gold,
      COALESCE(SUM(CASE WHEN slt.placement = 2 THEN 1 ELSE 0 END), 0) AS silver,
      COALESCE(SUM(CASE WHEN slt.placement = 3 THEN 1 ELSE 0 END), 0) AS bronze,
      COALESCE(SUM(
        CASE
          WHEN slt.placement = 1 THEN 3
          WHEN slt.placement = 2 THEN 2
          WHEN slt.placement = 3 THEN 1
          ELSE 0
        END
      ), 0) AS total_points
    FROM Organizations o
    JOIN Teams t ON t.organization_id = o.id AND t.org_approved = 1
    LEFT JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
      AND slt.placement IS NOT NULL
      AND slt.placement <= 3
    GROUP BY o.id, o.name, o.logo
    HAVING total_points > 0
    ORDER BY total_points DESC, gold DESC, silver DESC, bronze DESC, o.name ASC
    LIMIT ?
  `;
  const orgs = await runQuery<OrgRow[]>(orgsQuery, [limit]);

  if (orgs.length === 0) return [];

  // Get trophy groups for these organizations
  const orgIds = orgs.map((o) => o.organization_id);
  const trophiesQuery = `
    SELECT
      o.id AS organization_id,
      tr.image_phash,
      tr.name AS trophy_name,
      tr.placement,
      COUNT(*) AS count
    FROM Organizations o
    JOIN Teams t ON t.organization_id = o.id AND t.org_approved = 1
    JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
      AND slt.placement IS NOT NULL
      AND slt.placement <= 3
    JOIN Trophies tr ON tr.category = 'season_placement' AND tr.placement = slt.placement
    WHERE o.id IN (${orgIds.map(() => "?").join(",")})
    GROUP BY o.id, tr.image_phash, tr.name, tr.placement
    ORDER BY o.id, tr.placement
  `;
  const trophyRows = await runQuery<OrgTrophyRow[]>(trophiesQuery, orgIds);

  // Group trophies by organization
  const trophiesByOrg = new Map<number, TrophyGroup[]>();
  for (const row of trophyRows) {
    if (!trophiesByOrg.has(row.organization_id)) {
      trophiesByOrg.set(row.organization_id, []);
    }
    trophiesByOrg.get(row.organization_id)!.push({
      image_phash: row.image_phash,
      trophy_name: row.trophy_name,
      placement: row.placement,
      count: row.count
    });
  }

  return orgs.map((org) => ({
    ...org,
    trophies: trophiesByOrg.get(org.organization_id) || []
  }));
};

/**
 * Get teams ranked by trophy points
 */
export const getHallOfFameTeams = async (
  limit: number = 50
): Promise<HallOfFameTeam[]> => {
  const teamsQuery = `
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      t.team_logo AS team_logo,
      o.id AS organization_id,
      o.name AS organization_name,
      COALESCE(SUM(CASE WHEN slt.placement = 1 THEN 1 ELSE 0 END), 0) AS gold,
      COALESCE(SUM(CASE WHEN slt.placement = 2 THEN 1 ELSE 0 END), 0) AS silver,
      COALESCE(SUM(CASE WHEN slt.placement = 3 THEN 1 ELSE 0 END), 0) AS bronze,
      COALESCE(SUM(
        CASE
          WHEN slt.placement = 1 THEN 3
          WHEN slt.placement = 2 THEN 2
          WHEN slt.placement = 3 THEN 1
          ELSE 0
        END
      ), 0) AS total_points
    FROM Teams t
    LEFT JOIN Organizations o ON o.id = t.organization_id AND t.org_approved = 1
    JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
      AND slt.placement IS NOT NULL
      AND slt.placement <= 3
    GROUP BY t.id, t.name, t.team_logo, o.id, o.name
    HAVING total_points > 0
    ORDER BY total_points DESC, gold DESC, silver DESC, bronze DESC, t.name ASC
    LIMIT ?
  `;
  const teams = await runQuery<TeamRow[]>(teamsQuery, [limit]);

  if (teams.length === 0) return [];

  // Get trophy groups for these teams
  const teamIds = teams.map((t) => t.team_id);
  const trophiesQuery = `
    SELECT
      slt.team_id,
      tr.image_phash,
      tr.name AS trophy_name,
      tr.placement,
      COUNT(*) AS count
    FROM SeasonLeagueTeams slt
    JOIN Trophies tr ON tr.category = 'season_placement' AND tr.placement = slt.placement
    WHERE slt.team_id IN (${teamIds.map(() => "?").join(",")})
      AND slt.placement IS NOT NULL
      AND slt.placement <= 3
    GROUP BY slt.team_id, tr.image_phash, tr.name, tr.placement
    ORDER BY slt.team_id, tr.placement
  `;
  const trophyRows = await runQuery<TeamTrophyRow[]>(trophiesQuery, teamIds);

  // Group trophies by team
  const trophiesByTeam = new Map<number, TrophyGroup[]>();
  for (const row of trophyRows) {
    if (!trophiesByTeam.has(row.team_id)) {
      trophiesByTeam.set(row.team_id, []);
    }
    trophiesByTeam.get(row.team_id)!.push({
      image_phash: row.image_phash,
      trophy_name: row.trophy_name,
      placement: row.placement,
      count: row.count
    });
  }

  return teams.map((team) => ({
    ...team,
    trophies: trophiesByTeam.get(team.team_id) || []
  }));
};

/**
 * Get players ranked by trophy points
 * Players get trophy credit from:
 * 1. Team placement trophies (derived from SeasonLeagueTeams via SeasonTeamPlayers)
 * 2. Direct player trophies from TrophyAssignments (Kanarating, special, etc.)
 */
export const getHallOfFamePlayers = async (
  limit: number = 50
): Promise<HallOfFamePlayer[]> => {
  // This query combines trophies from two sources using UNION ALL
  const playersQuery = `
    SELECT 
      steam_id,
      player_name,
      avatar,
      SUM(gold) AS gold,
      SUM(silver) AS silver,
      SUM(bronze) AS bronze,
      SUM(gold) * 3 + SUM(silver) * 2 + SUM(bronze) AS total_points
    FROM (
      -- Team placement trophies derived from SeasonLeagueTeams via SeasonTeamPlayers
      SELECT
        sp.steam_id,
        sp.nickname AS player_name,
        sp.avatar,
        CASE WHEN slt.placement = 1 THEN 1 ELSE 0 END AS gold,
        CASE WHEN slt.placement = 2 THEN 1 ELSE 0 END AS silver,
        CASE WHEN slt.placement = 3 THEN 1 ELSE 0 END AS bronze
      FROM SteamPlayers sp
      JOIN SeasonTeamPlayers stp ON stp.steam_id = sp.steam_id AND stp.role = 'primary'
      JOIN SeasonLeagueTeams slt ON slt.team_id = stp.team_id
        AND slt.season_id = stp.season_id
        AND slt.placement IS NOT NULL
        AND slt.placement <= 3
      
      UNION ALL
      
      -- Direct player trophies from TrophyAssignments (kanarating, special, etc.)
      SELECT
        sp.steam_id,
        sp.nickname AS player_name,
        sp.avatar,
        CASE WHEN t.placement = 1 THEN 1 ELSE 0 END AS gold,
        CASE WHEN t.placement = 2 THEN 1 ELSE 0 END AS silver,
        CASE WHEN t.placement = 3 THEN 1 ELSE 0 END AS bronze
      FROM SteamPlayers sp
      JOIN TrophyAssignments ta ON ta.steam_id = sp.steam_id
      JOIN Trophies t ON t.id = ta.trophy_id
      WHERE t.placement IS NOT NULL AND t.placement <= 3
    ) AS all_trophies
    GROUP BY steam_id, player_name, avatar
    HAVING total_points > 0
    ORDER BY total_points DESC, gold DESC, silver DESC, bronze DESC, player_name ASC
    LIMIT ?
  `;
  const players = await runQuery<PlayerRow[]>(playersQuery, [limit]);

  if (players.length === 0) return [];

  // Get trophy groups for these players (grouped by image_phash)
  const steamIds = players.map((p) => p.steam_id);
  const trophiesQuery = `
    SELECT
      steam_id,
      image_phash,
      trophy_name,
      placement,
      SUM(count) AS count
    FROM (
      -- Team placement trophies via SeasonTeamPlayers
      SELECT
        stp.steam_id,
        tr.image_phash,
        tr.name AS trophy_name,
        tr.placement,
        COUNT(*) AS count
      FROM SeasonTeamPlayers stp
      JOIN SeasonLeagueTeams slt ON slt.team_id = stp.team_id
        AND slt.season_id = stp.season_id
        AND slt.placement IS NOT NULL
        AND slt.placement <= 3
      JOIN Trophies tr ON tr.category = 'season_placement' AND tr.placement = slt.placement
      WHERE stp.steam_id IN (${steamIds.map(() => "?").join(",")})
        AND stp.role = 'primary'
      GROUP BY stp.steam_id, tr.image_phash, tr.name, tr.placement
      
      UNION ALL
      
      -- Direct player trophies from TrophyAssignments
      SELECT
        ta.steam_id,
        t.image_phash,
        t.name AS trophy_name,
        t.placement,
        COUNT(*) AS count
      FROM TrophyAssignments ta
      JOIN Trophies t ON t.id = ta.trophy_id
      WHERE ta.steam_id IN (${steamIds.map(() => "?").join(",")})
        AND t.placement IS NOT NULL
        AND t.placement <= 3
      GROUP BY ta.steam_id, t.image_phash, t.name, t.placement
    ) AS grouped
    GROUP BY steam_id, image_phash, trophy_name, placement
    ORDER BY steam_id, placement
  `;
  const trophyRows = await runQuery<PlayerTrophyRow[]>(trophiesQuery, [
    ...steamIds,
    ...steamIds
  ]);

  // Group trophies by player
  const trophiesByPlayer = new Map<string, TrophyGroup[]>();
  for (const row of trophyRows) {
    if (!trophiesByPlayer.has(row.steam_id)) {
      trophiesByPlayer.set(row.steam_id, []);
    }
    trophiesByPlayer.get(row.steam_id)!.push({
      image_phash: row.image_phash,
      trophy_name: row.trophy_name,
      placement: row.placement,
      count: row.count
    });
  }

  return players.map((player) => ({
    ...player,
    trophies: trophiesByPlayer.get(player.steam_id) || []
  }));
};
