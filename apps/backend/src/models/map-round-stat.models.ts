import { type PoolConnection } from "mysql2/promise";
import { type ParsedPayload } from "../types/parse-queue.types";
import { runQuery } from "../db/mysqlRunQuery";
import { replaceMatchGameRows } from "../db/replaceMatchGameRows";
import { keepLastByKey } from "../utils/keep-last-by-key";
import { plantTimeSecondsOrNull } from "../utils/plant-time";

function parsePlantTimeSeconds(
  plantSite: string | null,
  bombplant: ParsedPayload["NewRoundInfo"]["Rounds"][number]["Bombplant"]
): number | null {
  if (plantSite !== "A" && plantSite !== "B") return null;
  return plantTimeSecondsOrNull(bombplant.Time);
}

interface SaveMapRoundStatsParams {
  matchGameId: number;
  tTeamIdTeam1: number;
  ctTeamIdTeam2: number;
  mapRoundStats: ParsedPayload["NewRoundInfo"]["Rounds"];
  connection: PoolConnection;
}

export const saveMapRoundStatsForGame = async ({
  matchGameId,
  tTeamIdTeam1,
  ctTeamIdTeam2,
  mapRoundStats,
  connection
}: SaveMapRoundStatsParams) => {
  await replaceMatchGameRows(
    connection,
    matchGameId,
    "MapRoundStats",
    async () => {
      if (!mapRoundStats || mapRoundStats.length === 0) return;

      const uniqueRounds = keepLastByKey(mapRoundStats, (round) =>
        String(round.RoundNumber)
      );

      const values = uniqueRounds.map((round) => {
        const plantSite = round.Bombplant.Site || null;
        return [
          matchGameId,
          round.CT_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2,
          round.T_Team === 1 ? tTeamIdTeam1 : ctTeamIdTeam2,
          round.RoundNumber,
          round.RoundEndInfo,
          JSON.stringify(round.Bombplant.Alive),
          round.FirstKill,
          plantSite,
          parsePlantTimeSeconds(plantSite, round.Bombplant),
          round.CTBuyType || null,
          round.TBuyType || null,
          round.CTPreBuyBank ?? null,
          round.TPreBuyBank ?? null,
          round.CTEquipmentValue ?? null,
          round.TEquipmentValue ?? null,
          round.Importance ?? null,
          round.Winner ?? null,
          round.RoundType ?? null,
          round.CTAvgBank ?? null,
          round.TAvgBank ?? null,
          round.CTTotalBank ?? null,
          round.TTotalBank ?? null,
          round.CTPreBuyEqValue ?? null,
          round.TPreBuyEqValue ?? null,
          round.CTEndBank ?? null,
          round.TEndBank ?? null,
          round.CTEndEqValue ?? null,
          round.TEndEqValue ?? null,
          round.CTBuyStrategy ?? null,
          round.TBuyStrategy ?? null
        ];
      });

      const placeholders = values
        .map(
          () =>
            "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .join(", ");

      await runQuery(
        `INSERT INTO MapRoundStats (
        match_game_id,
        ct_team_id,
        t_team_id,
        round_number,
        round_end_reason_info,
        ct_t,
        first_kill,
        plant_site,
        plant_time,
        ct_buy_type,
        t_buy_type,
        ct_pre_buy_bank,
        t_pre_buy_bank,
        ct_equipment_value,
        t_equipment_value,
        importance,
        winner,
        round_type,
        ct_avg_bank,
        t_avg_bank,
        ct_total_bank,
        t_total_bank,
        ct_pre_buy_eq_value,
        t_pre_buy_eq_value,
        ct_end_bank,
        t_end_bank,
        ct_end_eq_value,
        t_end_eq_value,
        ct_buy_strategy,
        t_buy_strategy
      ) VALUES ${placeholders}`,
        values.flat(),
        connection
      );
    }
  );
};
