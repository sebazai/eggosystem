import {
  SeasonPlatform,
  type SeasonPlayerRankFormValues,
  type PostTeamManualPlayerApprovalSchemaType,
  type ActiveSeasonSignupForAppId,
  SeasonRegisteredTeamsWithPlayers,
  SeasonTeamRegistration
} from "@eggosystem/types";
import { getConnection } from "../../db/mysqlConnection";
import { handlePreApprovedRegistration } from "../../services/dashboard/registration.services";
import { getActiveSignupSeasonForAppId } from "../season.models";
import { BadRequestError } from "../../utils/errors";
import {
  insertCSPlayerRankForSeason,
  insertFaceITPlayerRankForSeason
} from "../season-player-ranks.models";
import { faceitEloToLevel } from "../../utils/faceit-utils";
import { runQuery } from "../../db/mysqlRunQuery";

export const addManuallyApprovedPartialSignupForSeason = async (
  formData: PostTeamManualPlayerApprovalSchemaType
) => {
  const connection = await getConnection();

  const activeSeason = await getActiveSignupSeasonForAppId(730);

  if (!activeSeason) {
    throw new BadRequestError("No active registration ongoing for CS");
  }

  try {
    await connection.beginTransaction();
    const data = await handlePreApprovedRegistration(
      activeSeason.season_id,
      formData,
      connection
    );
    await connection.commit();
    return { seasonId: activeSeason.season_id, ...data };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addSeasonRankForPlayer = async (
  formData: SeasonPlayerRankFormValues,
  season: ActiveSeasonSignupForAppId
) => {
  const cs2Rank = formData.cs2_rank || -1;
  const csHours = formData.cs_hours || -1;
  if (season.platform === SeasonPlatform.FACEIT && formData.external_elo) {
    await insertFaceITPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank,
      csHours,
      {
        faceit_elo: formData.external_elo || -1,
        faceit_level: faceitEloToLevel(formData.external_elo || -1),
        faceit_kd: 1,
        faceit_date: new Date().getTime()
      },
      { isManuallyAdded: true }
    );
  } else {
    await insertCSPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank,
      csHours,
      { isManuallyAdded: true }
    );
  }
};

interface RegisteredTeamQueryResult extends SeasonTeamRegistration {
  team_name: string;
  players: string;
  season_platform: SeasonPlatform;
  captain_nickname: string;
  co_captain_nickname: string;
}

export const getRegisteredTeams = async (seasonId: number) => {
  const query = `
    SELECT 
      str.*,
      t.name as team_name,
      s.platform as season_platform,
      spc.nickname as captain_nickname,
      spcc.nickname as co_captain_nickname,
      GROUP_CONCAT(CONCAT(sp.steam_id, ':', sp.nickname) SEPARATOR ',') as players
    FROM SeasonTeamRegistrations str 
      JOIN Teams t ON str.team_id = t.id 
      JOIN SeasonTeamPlayers stp ON str.team_id = stp.team_id AND stp.season_id = str.season_id
      JOIN Seasons s ON str.season_id = s.id
      LEFT JOIN SteamPlayers spc ON str.captain_steam_id = spc.steam_id
      LEFT JOIN SteamPlayers spcc ON str.co_captain_steam_id = spcc.steam_id
      JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
    WHERE str.season_id = ?
    GROUP BY str.team_id, t.name, str.season_id
  `;
  const rows = await runQuery<RegisteredTeamQueryResult[]>(query, [seasonId]);
  // Parse players string into array of objects
  return rows.map(
    (row) =>
      ({
        ...row,
        players: row.players
          ? row.players.split(",").map((p: string) => {
              const [steam_id, nickname] = p.split(":");
              return { steam_id, nickname };
            })
          : []
      }) satisfies SeasonRegisteredTeamsWithPlayers
  );
};
