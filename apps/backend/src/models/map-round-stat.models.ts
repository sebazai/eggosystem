import { type PoolConnection } from "mysql2/promise";
import { type ParsedPayload } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";

interface MapRoundStatsParams {
  gameId: number;
  tTeamId: number;
  ctTeamId: number;
  mapRoundStats: ParsedPayload["NewRoundInfo"]["Rounds"];
  connection?: PoolConnection;
}

export const insertMapRoundStats = async ({
  gameId,
  tTeamId,
  ctTeamId,
  mapRoundStats,
  connection
}: MapRoundStatsParams) => {
  const query = `INSERT INTO MapRoundStats (game_id, ct_team_id, t_team_id, round_number, round_end_reason_info, ct_t, first_kill, plant_site) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  await Promise.all(
    mapRoundStats.map(async (round) => {
      const values = [
        gameId,
        ctTeamId,
        tTeamId,
        round.RoundNumber,
        round.RoundEndInfo,
        JSON.stringify(round.Bombplant.Alive),
        round.FirstKill,
        round.Bombplant.Site
      ];
      await runQuery(query, values, connection);
    })
  );
};
