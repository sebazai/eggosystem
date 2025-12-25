import { type PoolConnection } from "mysql2/promise";
import { type ParsedPayload } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";

interface MapRoundStatsParams {
  matchGameId: number;
  tTeamIdTeam1: number;
  ctTeamIdTeam2: number;
  mapRoundStats: ParsedPayload["NewRoundInfo"]["Rounds"];
  connection?: PoolConnection;
}

export const upsertMapRoundStats = async ({
  matchGameId,
  tTeamIdTeam1,
  ctTeamIdTeam2,
  mapRoundStats,
  connection
}: MapRoundStatsParams) => {
  const query = `INSERT INTO MapRoundStats (
      match_game_id,
      ct_team_id,
      t_team_id,
      round_number,
      round_end_reason_info,
      ct_t,
      first_kill,
      plant_site,
      ct_buy_type,
      t_buy_type,
      ct_pre_buy_bank,
      t_pre_buy_bank,
      ct_equipment_value,
      t_equipment_value,
      importance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      ct_team_id = VALUES(ct_team_id),
      t_team_id = VALUES(t_team_id),
      round_end_reason_info = VALUES(round_end_reason_info),
      ct_t = VALUES(ct_t),
      first_kill = VALUES(first_kill),
      plant_site = VALUES(plant_site),
      ct_buy_type = VALUES(ct_buy_type),
      t_buy_type = VALUES(t_buy_type),
      ct_pre_buy_bank = VALUES(ct_pre_buy_bank),
      t_pre_buy_bank = VALUES(t_pre_buy_bank),
      ct_equipment_value = VALUES(ct_equipment_value),
      t_equipment_value = VALUES(t_equipment_value),
      importance = VALUES(importance)`;
  await Promise.all(
    mapRoundStats.map(async (round) => {
      const values = [
        matchGameId,
        round.CT_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2, // First half CT_Team is 2, second half is 1
        round.T_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2, // First half T_Team is 1, second half is 2
        round.RoundNumber,
        round.RoundEndInfo,
        JSON.stringify(round.Bombplant.Alive),
        round.FirstKill,
        round.Bombplant.Site || null,
        round.CTBuyType || null,
        round.TBuyType || null,
        round.CTPreBuyBank ?? null,
        round.TPreBuyBank ?? null,
        round.CTEquipmentValue ?? null,
        round.TEquipmentValue ?? null,
        round.Importance ?? null
      ];
      await runQuery(query, values, connection);
    })
  );
};
