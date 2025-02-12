interface Filter {
  key: string;
  column: string;
  value: string | number | undefined;
}

export const generateQueryWithFilters = (
  baseQuery: string,
  filterValues: {
    team_id?: number;
    season_id?: number;
    map?: string;
    league_id?: number;
    stage?: number;
  },
  isMatchQuery: boolean = false,
): { query: string; queryParams: (string | number)[] } => {
  const filters: Filter[] = [
    {
      key: "team_id",
      column: isMatchQuery ? "(m.team1 = ? OR m.team2 = ?)" : "p.team_id",
      value: filterValues.team_id,
    },
    { key: "seasonid", column: "l.season_id", value: filterValues.season_id },
    { key: "map", column: "m.map", value: filterValues.map },
    { key: "leagueid", column: "l.id", value: filterValues.league_id },
    { key: "stage", column: "m.stage", value: filterValues.stage },
  ];

  let query = baseQuery;
  const queryParams: (string | number)[] = [];

  filters.forEach((filter) => {
    if (filter.value !== undefined) {
      if (filter.key === "team_id" && isMatchQuery) {
        query += ` AND ${filter.column}`;
        queryParams.push(filter.value, filter.value); // Push the value twice for the OR condition
      } else {
        query += ` AND ${filter.column} = ?`;
        queryParams.push(filter.value);
      }
    }
  });

  return { query, queryParams };
};
