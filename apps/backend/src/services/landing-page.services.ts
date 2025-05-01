import { runQuery } from "../db/mysqlRunQuery";
import { expireIn7Days, redisClient } from "../utils/redisClient";

export const landingPageStatistics = async () => {
  const redisKey = "landing-page-statistics";
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData);
  }
  const uniquePlayersQuery = runQuery<Array<{ unique_players: number }>>(
    "SELECT COUNT(*) AS unique_players FROM SteamPlayers"
  );
  const totalGamesQuery = runQuery<Array<{ total_games: number }>>(
    "SELECT COUNT(*) AS total_games FROM MatchGames"
  );
  const totalOrganizationsQuery = runQuery<
    Array<{ total_organizations: number }>
  >("SELECT COUNT(*) AS total_organizations FROM Organizations");
  const totalTeamsQuery = runQuery<Array<{ total_teams: number }>>(
    "SELECT COUNT(*) AS total_teams FROM Teams"
  );
  const data = await Promise.all([
    uniquePlayersQuery,
    totalGamesQuery,
    totalOrganizationsQuery,
    totalTeamsQuery
  ]);
  const uniquePlayers = data[0][0].unique_players;
  const totalGames = data[1][0].total_games;
  const totalOrganizations = data[2][0].total_organizations;
  const totalTeams = data[3][0].total_teams;
  const statistics = {
    unique_players: uniquePlayers,
    total_games: totalGames,
    total_organizations: totalOrganizations,
    total_teams: totalTeams
  };
  await redisClient.set(
    redisKey,
    JSON.stringify(statistics),
    "EX",
    expireIn7Days
  );
  return statistics;
};
