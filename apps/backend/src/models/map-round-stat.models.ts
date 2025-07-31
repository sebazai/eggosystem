import { type PoolConnection } from "mysql2/promise";
import { type ParsedPayload } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";

interface MapRoundStatsParams {
  gameId: number;
  tTeamIdTeam1: number;
  ctTeamIdTeam2: number;
  mapRoundStats: ParsedPayload["NewRoundInfo"]["Rounds"];
  connection?: PoolConnection;
}

export const insertMapRoundStats = async ({
  gameId,
  tTeamIdTeam1,
  ctTeamIdTeam2,
  mapRoundStats,
  connection
}: MapRoundStatsParams) => {
  const query = `INSERT INTO MapRoundStats (game_id, ct_team_id, t_team_id, round_number, round_end_reason_info, ct_t, first_kill, plant_site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await Promise.all(
    mapRoundStats.map(async (round) => {
      const values = [
        gameId,
        round.CT_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2, // First half CT_Team is 2, second half is 1
        round.T_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2, // First half T_Team is 1, second half is 2
        round.RoundNumber,
        round.RoundEndInfo,
        JSON.stringify(round.Bombplant.Alive),
        round.FirstKill,
        round.Bombplant.Site || null
      ];
      await runQuery(query, values, connection);
    })
  );
};
