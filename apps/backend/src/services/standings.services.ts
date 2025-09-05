import {
  type Match,
  type StandingsFaceitTeamStats,
  type StandingsLeagues
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { logger } from "../utils/app-logger";
import { generateYMD } from "../utils/date-utils";
import { redisClient, expireInOneDay } from "../utils/redisClient";

interface FaceitMatchData {
  date: string;
  match_id: string;
  demo_url: string[];
}

interface FaceitMatchResponse {
  items: Array<{
    match_id: string;
    status: string;
    scheduled_at: number;
    demo_url: string[];
  }>;
}

interface FaceitMatchStatsResponse {
  rounds: Array<{
    round_stats: {
      Rounds: string;
    };
    teams: Array<{
      team_stats: {
        Team: string;
        "Final Score": string;
      };
    }>;
  }>;
}

const FACEIT_API_TOKEN = process.env.FACEIT_API_KEY;

const getFaceitMatchesFromDbForFaceitLeague = async (
  externalLeagueId: string,
  group?: string
) => {
  let query = `
    SELECT m.* FROM Matches m
    JOIN SeasonLeagueExternalIds slei ON m.season_id = slei.season_id 
      AND m.league_id = slei.league_id
      AND (m.group = slei.group OR (m.group IS NULL AND slei.group IS NULL))
    WHERE slei.external_id = ? AND m.status IN ('FINISHED', 'FORFEIT')
  `;
  const params: string[] = [externalLeagueId];

  if (group) {
    query += ` AND slei.group = ?`;
    params.push(group);
  }

  const matches = await runQuery<Match[]>(query, params);
  return matches;
};

// Get matches from a Faceit championship/league
export const getFaceitMatchesForFaceitLeague = async (
  leagueId: string,
  type: string = "all",
  limit: number = 100,
  offset: number = 0
): Promise<FaceitMatchData[]> => {
  if (!FACEIT_API_TOKEN) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const webURL = `https://open.faceit.com/data/v4/championships/${leagueId}/matches`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${FACEIT_API_TOKEN}`,
    "User-Agent": "Kanaliiga-Eggosystem/1.0"
  };

  logger.info(
    `[Standings] Querying matches for league ${leagueId} with type ${type} and limit ${limit} and offset ${offset}`
  );

  try {
    // Manual URL construction with params since fetch doesn't support params directly
    const urlWithParams = `${webURL}?type=${type}&limit=${limit}&offset=${offset}`;
    const finalResponse = await fetch(urlWithParams, { headers });

    if (!finalResponse.ok) {
      throw new Error(
        `Faceit API returned ${finalResponse.status}: ${finalResponse.statusText}`
      );
    }

    const data: FaceitMatchResponse = await finalResponse.json();

    // Filter finished matches and map to required format
    const matches = data.items;
    logger.info(
      `[Standings] Found ${matches.length} matches for league ${leagueId} with type ${type} and limit ${limit} and offset ${offset}`
    );

    const matchData: FaceitMatchData[] = matches.map((match) => ({
      date: generateYMD(match.scheduled_at),
      match_id: match.match_id,
      demo_url: match.demo_url || []
    }));

    return matchData;
  } catch (error) {
    logger.error(`Error fetching matches for league ${leagueId}:`, error);
    throw error;
  }
};

// Get match statistics from Faceit
const getFaceitMatchInfo = async (
  faceitMatchId: string
): Promise<StandingsFaceitTeamStats[]> => {
  if (!FACEIT_API_TOKEN) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const webURL = `https://open.faceit.com/data/v4/matches/${faceitMatchId}/stats`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${FACEIT_API_TOKEN}`,
    "User-Agent": "Kanaliiga-Eggosystem/1.0"
  };

  logger.info(`[Standings] Querying match info for match ${faceitMatchId}`);

  // Check Redis cache first
  const redisKey = `match:${faceitMatchId}`;
  const cached = await redisClient.get(redisKey);
  if (cached) {
    logger.info(`[Standings] Returning cached match data for ${faceitMatchId}`);
    return JSON.parse(cached);
  }

  // Initialize team statistics object
  const teamStats: Record<string, StandingsFaceitTeamStats> = {};

  const response = await fetch(webURL, { headers });

  if (!response.ok) {
    // TODO: Div 10 S4 Lohko A, https://www.faceit.com/en/cs2/room/1-c88006a8-c4d2-4e3c-9270-750e3802ec29
    // const webURL = `https://open.faceit.com/data/v4/matches/${faceitMatchId}`;
    // This endpoint works, should we add +3 points or just fail silently? :)
    throw new Error(
      `Faceit API returned ${response.status}: ${response.statusText}`
    );
  }

  const data: FaceitMatchStatsResponse = await response.json();

  // Process each round and calculate team statistics
  data.rounds.forEach((round) => {
    const overtime = Number(round.round_stats.Rounds) > 24 ? 1 : 0;

    round.teams.forEach((team, index) => {
      const opponent = round.teams[1 - index];
      const teamName = team.team_stats.Team;
      const roundsWon = Number(team.team_stats["Final Score"]);
      const roundsLost = Number(opponent.team_stats["Final Score"]);
      const mapsWon = roundsWon > roundsLost ? 1 : 0;

      // Calculate points: 3 for win, 2 for overtime win, 1 for overtime loss, 0 for loss
      const points = mapsWon ? 3 - overtime : overtime;

      if (!teamStats[teamName]) {
        teamStats[teamName] = {
          team_name: teamName,
          games_played: 0,
          maps_won: 0,
          maps_won_ot: 0,
          maps_lost: 0,
          maps_lost_ot: 0,
          points: 0,
          rounds_won: 0,
          rounds_lost: 0,
          rounds_diff: 0
        };
      }

      teamStats[teamName].games_played += 1;
      teamStats[teamName].maps_won += overtime ? 0 : mapsWon;
      teamStats[teamName].maps_lost += !overtime && !mapsWon ? 1 : 0;
      teamStats[teamName].maps_won_ot += overtime ? mapsWon : 0;
      teamStats[teamName].maps_lost_ot += overtime && !mapsWon ? 1 : 0;
      teamStats[teamName].rounds_won += roundsWon;
      teamStats[teamName].rounds_lost += roundsLost;
      teamStats[teamName].rounds_diff += roundsWon - roundsLost;
      teamStats[teamName].points += points;
    });
  });

  // Convert to array
  const teams = Object.values(teamStats);

  await redisClient.set(redisKey, JSON.stringify(teams), "EX", expireInOneDay);

  return teams;
};

export const getDivStandings = async (
  faceitLeagueId: string
): Promise<StandingsFaceitTeamStats[]> => {
  // Get matches from league
  const matchesRaw =
    await getFaceitMatchesFromDbForFaceitLeague(faceitLeagueId);
  const matches = matchesRaw
    .map((match) => match.external_match_room_id)
    .filter((id): id is string => id !== null);

  // Get stats for each match
  const teamStatsArray: StandingsFaceitTeamStats[][] = [];
  for (const matchId of matches) {
    const stats = await getFaceitMatchInfo(matchId);
    teamStatsArray.push(stats);
  }

  // Combine stats for each team by team_name
  const combinedStats = teamStatsArray.reduce(
    (acc: StandingsFaceitTeamStats[], stats: StandingsFaceitTeamStats[]) => {
      stats.forEach((team) => {
        const existingTeam = acc.find((t) => t.team_name === team.team_name);
        if (existingTeam) {
          existingTeam.games_played += team.games_played;
          existingTeam.points += team.points;
          existingTeam.maps_won += team.maps_won;
          existingTeam.maps_won_ot += team.maps_won_ot;
          existingTeam.maps_lost += team.maps_lost;
          existingTeam.maps_lost_ot += team.maps_lost_ot;
          existingTeam.rounds_won += team.rounds_won;
          existingTeam.rounds_lost += team.rounds_lost;
          existingTeam.rounds_diff += team.rounds_diff;
        } else {
          acc.push({ ...team });
        }
      });
      return acc;
    },
    []
  );

  // Sort by points first, then by round difference
  combinedStats.sort((a, b) => {
    if (a.points === b.points) {
      return b.rounds_diff - a.rounds_diff;
    }
    return b.points - a.points;
  });

  return combinedStats;
};

export const getStandingsLeagues = async (seasonId: number) => {
  const query = `
    SELECT l.name AS league_name, sl.tier, slei.* FROM SeasonLeagueExternalIds slei
     JOIN SeasonLeagues sl ON slei.season_id = sl.season_id AND slei.league_id = sl.league_id
     JOIN Leagues l ON sl.league_id = l.id
    WHERE slei.season_id = ?
  `;

  const leagues = await runQuery<StandingsLeagues>(query, [seasonId]);
  return leagues;
};
