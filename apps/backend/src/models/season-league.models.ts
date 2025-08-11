import { type SeasonLeague } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasonLeagueBySeasonAndFaceitName = async (
  seasonId: number,
  leagueName: string
) => {
  const isLeagueNameNumeric = !isNaN(Number(leagueName));
  const leagueFullName = isLeagueNameNumeric ? `div${leagueName}` : leagueName;
  const query = `SELECT * FROM SeasonLeagues sl
    JOIN Leagues l ON sl.league_id = l.id
    WHERE sl.season_id = ? AND l.name = ?
  `;
  const [seasonLeague] = await runQuery<Array<SeasonLeague | undefined>>(
    query,
    [seasonId, leagueFullName]
  );
  return seasonLeague;
};
