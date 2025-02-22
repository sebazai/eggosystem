import { Nullable } from "@eggosystem/types";

interface Filter {
  column: string;
  value: Nullable<number>;
}

export const generateQueryWithFilters = (
  filters: Filter[],
): { query: string; queryParams: (string | number)[] } => {
  // const filters: Filter[] = [
  //   { key: "season_id", column: "l.season_id", value: filterValues.season_id },
  //   { key: "league_id", column: "l.id", value: filterValues.league_id },
  //   {
  //     key: "team_id",
  //     column: isMatchQuery ? "(m.team1 = ? OR m.team2 = ?)" : "p.team_id",
  //     value: filterValues.team_id,
  //   },
  //   { key: "stage", column: "m.stage", value: filterValues.stage },
  //   { key: "map_id", column: "m.map", value: filterValues.map_id },
  // ];

  let query = "";
  const queryParams: (string | number)[] = [];

  filters.forEach((filter) => {
    if (filter.value !== null) {
      query += ` AND ${filter.column} = ?`;
      queryParams.push(filter.value);
    }
  });

  return { query, queryParams };
};
