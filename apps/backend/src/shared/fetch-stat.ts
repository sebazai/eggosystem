import type {
  MatchOrGameTopPlayerAwards,
  MatchTopPlayersQueryResult,
  PlayerStats
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const matchTopStats = [
  { key: "most_kills", column: "kills", sqlFunction: "SUM" },
  { key: "most_adr", column: "adr", sqlFunction: "AVG" },
  { key: "most_assists", column: "assists", sqlFunction: "SUM" },
  { key: "most_awp_kills", column: "awp_kills", sqlFunction: "SUM" },
  { key: "most_utility_damage", column: "utility_damage", sqlFunction: "SUM" },
  { key: "most_first_kills", column: "first_kills", sqlFunction: "SUM" },
  { key: "most_mates_flashed", column: "mates_flashed", sqlFunction: "SUM" },
  { key: "most_flash_assists", column: "flash_assists", sqlFunction: "SUM" }
] satisfies {
  key: keyof MatchOrGameTopPlayerAwards;
  column: keyof PlayerStats;
  sqlFunction?: string;
}[];

export const fetchPlayerStatsForMatchOrGame = async <
  T extends keyof PlayerStats
>(
  match_or_game_id: number,
  whereClause: string,
  {
    key,
    column
  }: {
    key: keyof MatchOrGameTopPlayerAwards;
    column: T;
  },
  sqlFunction?: string
) => {
  const query = `
      SELECT p.steam_id, p.nickname, ${sqlFunction ? `${sqlFunction}(ps.${column})` : `ps.${column}`} as value, stp.team_id
      FROM PlayerStats ps 
      JOIN SteamPlayers p ON p.steam_id = ps.steam_id 
      JOIN MatchGames mg ON mg.id = ps.game_id
      JOIN Matches m ON m.id = mg.match_id
      JOIN MatchTeams mt ON mt.match_id = m.id
      JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id AND stp.team_id = mt.team_id
      WHERE ${whereClause} 
      GROUP BY p.steam_id, p.nickname
      ORDER BY value DESC, p.nickname ASC 
      LIMIT 1;
    `;
  const [queryResults] = await runQuery<MatchTopPlayersQueryResult<T>[]>(
    query,
    [match_or_game_id]
  );

  return { [key]: queryResults };
};
