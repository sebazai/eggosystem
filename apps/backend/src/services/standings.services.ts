import { logger } from "../utils/app-logger";
import { redisClient, expireInOneDay } from "../utils/redisClient";

interface TeamStats {
  team_name: string;
  games_played: number;
  maps_won: number;
  maps_won_ot: number;
  maps_lost: number;
  maps_lost_ot: number;
  points: number;
  rounds_won: number;
  rounds_lost: number;
  rounds_diff: number;
}

interface MatchData {
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

// Helper function to format timestamp to Y-m-d format
const generateYMD = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get matches from a Faceit championship/league
const getMatches = async (leagueId: string): Promise<MatchData[]> => {
  if (!FACEIT_API_TOKEN) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const webURL = `https://open.faceit.com/data/v4/championships/${leagueId}/matches`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${FACEIT_API_TOKEN}`,
    "User-Agent": "Kanaliiga-Eggosystem/1.0"
  };

  logger.info(`Querying matches for league ${leagueId}`);

  try {
    // Manual URL construction with params since fetch doesn't support params directly
    const urlWithParams = `${webURL}?type=past&limit=100`;
    const finalResponse = await fetch(urlWithParams, { headers });

    if (!finalResponse.ok) {
      throw new Error(
        `Faceit API returned ${finalResponse.status}: ${finalResponse.statusText}`
      );
    }

    const data: FaceitMatchResponse = await finalResponse.json();

    // Filter finished matches and map to required format
    const matches = data.items;
    const finishedMatches = matches.filter(
      (match) => match.status === "FINISHED"
    );

    const matchData: MatchData[] = finishedMatches.map((match) => ({
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
const getMatchInfo = async (matchId: string): Promise<TeamStats[]> => {
  if (!FACEIT_API_TOKEN) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const webURL = `https://open.faceit.com/data/v4/matches/${matchId}/stats`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${FACEIT_API_TOKEN}`,
    "User-Agent": "Kanaliiga-Eggosystem/1.0"
  };

  logger.info(`Querying match info for match ${matchId}`);

  // Check Redis cache first
  const redisKey = `match:${matchId}`;
  try {
    const cached = await redisClient.get(redisKey);
    if (cached) {
      logger.info(`Returning cached match data for ${matchId}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis error for match ${matchId}:`, error);
  }

  // Initialize team statistics object
  const teamStats: Record<string, TeamStats> = {};

  try {
    const response = await fetch(webURL, { headers });

    if (!response.ok) {
      // Handle specific broken matches with hardcoded data (from original code)
      const brokenMatchData = getBrokenMatchData(matchId);
      if (brokenMatchData) {
        logger.info(`Using hardcoded data for broken match ${matchId}`);
        // Cache the hardcoded result
        try {
          await redisClient.set(
            redisKey,
            JSON.stringify(brokenMatchData),
            "EX",
            expireInOneDay
          );
        } catch (error) {
          logger.warn(`Failed to cache hardcoded match ${matchId}:`, error);
        }
        return brokenMatchData;
      }

      // Check additional broken matches
      const additionalBrokenMatchData = getAdditionalBrokenMatchData(matchId);
      if (additionalBrokenMatchData) {
        logger.info(
          `Using additional hardcoded data for broken match ${matchId}`
        );
        // Cache the hardcoded result
        try {
          await redisClient.set(
            redisKey,
            JSON.stringify(additionalBrokenMatchData),
            "EX",
            expireInOneDay
          );
        } catch (error) {
          logger.warn(
            `Failed to cache additional hardcoded match ${matchId}:`,
            error
          );
        }
        return additionalBrokenMatchData;
      }

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

    // Cache the result
    try {
      await redisClient.set(
        redisKey,
        JSON.stringify(teams),
        "EX",
        expireInOneDay
      );
    } catch (error) {
      logger.warn(`Failed to cache match ${matchId}:`, error);
    }

    return teams;
  } catch (error) {
    logger.error(`Error getting match info for ${matchId}:`, error);

    // Try to return broken match data if available
    const brokenMatchData = getBrokenMatchData(matchId);
    if (brokenMatchData) {
      logger.info(
        `Using hardcoded data for broken match ${matchId} after error`
      );
      // Cache the hardcoded result
      try {
        await redisClient.set(
          redisKey,
          JSON.stringify(brokenMatchData),
          "EX",
          expireInOneDay
        );
      } catch (cacheError) {
        logger.warn(`Failed to cache hardcoded match ${matchId}:`, cacheError);
      }
      return brokenMatchData;
    }

    // Check additional broken matches
    const additionalBrokenMatchData = getAdditionalBrokenMatchData(matchId);
    if (additionalBrokenMatchData) {
      logger.info(
        `Using additional hardcoded data for broken match ${matchId} after error`
      );
      // Cache the hardcoded result
      try {
        await redisClient.set(
          redisKey,
          JSON.stringify(additionalBrokenMatchData),
          "EX",
          expireInOneDay
        );
      } catch (cacheError) {
        logger.warn(
          `Failed to cache additional hardcoded match ${matchId}:`,
          cacheError
        );
      }
      return additionalBrokenMatchData;
    }

    throw error;
  }
};

// Hardcoded data for broken matches (from original code)
const getBrokenMatchData = (matchId: string): TeamStats[] | null => {
  const brokenMatches: Record<string, TeamStats[]> = {
    "1-fb8f5a04-d44d-4cad-8d47-3ec9775aba04": [
      {
        team_name: "Loihde",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Visma in Pyjama",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-2341a98c-633c-4b8c-b3b3-64c5a9d4f26a": [
      {
        team_name: "Nokia gNBots",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Yle",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-4e0c9ba1-729c-479b-ab36-d6b6d0938820": [
      {
        team_name: "VR Pendolino",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "SOK Tilipaiva",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-a969a0e9-fc29-488d-86be-c7f48f215948": [
      {
        team_name: "Telia Finland",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Onninen Hosujat",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-5cca5f17-27b6-4f5b-b05d-7421c31f5f80": [
      {
        team_name: "Linkity",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Hoxhunt",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-edde6b6a-afdb-4462-b898-12fa11cda5bf": [
      {
        team_name: "Symbio Finland",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "VR Resiina",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-629e436b-82c1-4b8a-81e6-c45e8e287eb1": [
      {
        team_name: "GiganttiGaming",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Valtori",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-cb6b671f-334e-495b-901f-19ab4d7b3465": [
      {
        team_name: "GAimers",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Mehilainen-BR",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-3ec9f4ab-938e-4f13-94f6-214cb77181df": [
      {
        team_name: "Linkity",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Virnex",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-1ca70681-589b-4603-a276-a6dcda3c194d": [
      {
        team_name: "Cimcorp eSports",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "CABB Esports 2",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-e3bdaebb-b0ff-4226-bdac-b3f86c414e15": [
      {
        team_name: "HYVAKS X-Men",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 1,
        maps_lost: 0,
        maps_lost_ot: 1,
        points: 3,
        rounds_won: 28,
        rounds_lost: 25,
        rounds_diff: 3
      },
      {
        team_name: "Praecopium",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 1,
        maps_lost: 0,
        maps_lost_ot: 1,
        points: 3,
        rounds_won: 25,
        rounds_lost: 28,
        rounds_diff: -3
      }
    ]
  };

  return brokenMatches[matchId] || null;
};

// Additional hardcoded data for specific broken matches
const getAdditionalBrokenMatchData = (matchId: string): TeamStats[] | null => {
  const additionalBrokenMatches: Record<string, TeamStats[]> = {
    "1-4fd81d43-ec01-4685-a23c-79c949c0cb7e": [
      {
        team_name: "AFRYysi",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      },
      {
        team_name: "FL ESPORTS",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      }
    ],
    "1-71dc58e9-78fa-4fe3-9cde-f03c41bd290a": [
      {
        team_name: "EA T20",
        games_played: 2,
        maps_won: 2,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 6,
        rounds_won: 12,
        rounds_lost: 0,
        rounds_diff: 12
      },
      {
        team_name: "Colossal Order",
        games_played: 2,
        maps_won: 0,
        maps_won_ot: 0,
        maps_lost: 2,
        maps_lost_ot: 0,
        points: 0,
        rounds_won: 0,
        rounds_lost: 12,
        rounds_diff: -12
      }
    ],
    "1-451868b8-d4b0-45e8-80a1-487ad0fe9c12": [
      {
        team_name: "AzetsCS",
        games_played: 2,
        maps_won: 1,
        maps_won_ot: 0,
        maps_lost: 0,
        maps_lost_ot: 0,
        points: 3,
        rounds_won: 21,
        rounds_lost: 24,
        rounds_diff: -3
      },
      {
        team_name: "Solita Glowball",
        games_played: 2,
        maps_won: 1,
        maps_won_ot: 0,
        maps_lost: 1,
        maps_lost_ot: 0,
        points: 3,
        rounds_won: 24,
        rounds_lost: 21,
        rounds_diff: 3
      }
    ]
  };

  return additionalBrokenMatches[matchId] || null;
};

// Main function to get division standings
export const getDivStandings = async (
  leagueId: string
): Promise<TeamStats[]> => {
  try {
    // Get matches from league
    const matchesRaw = await getMatches(leagueId);
    const matches = matchesRaw.map((match) => match.match_id);

    // Get stats for each match
    const teamStatsArray: TeamStats[][] = [];
    for (const matchId of matches) {
      const stats = await getMatchInfo(matchId);
      teamStatsArray.push(stats);
    }

    // Combine stats for each team by team_name
    const combinedStats = teamStatsArray.reduce(
      (acc: TeamStats[], stats: TeamStats[]) => {
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
  } catch (error) {
    logger.error(
      `Error getting division standings for league ${leagueId}:`,
      error
    );
    throw error;
  }
};
