import { generateQueryWithFilters } from "../../middlewares/queryFilter";

describe("generateQueryWithFilters", () => {
  test("should return '1=1' when no filters are provided", () => {
    const result = generateQueryWithFilters([]);
    expect(result).toEqual({ query: "1=1", queryParams: [] });
  });

  test("should generate a simple query for a single column", () => {
    const result = generateQueryWithFilters([
      { column: "season_id", value: [11] }
    ]);
    expect(result).toEqual({ query: "season_id = ?", queryParams: [11] }); // Fixed: Expect "=" instead of "IN"
  });

  test("should generate a query with multiple values using IN", () => {
    const result = generateQueryWithFilters([
      { column: "league_id", value: [66, 67, 68] }
    ]);
    expect(result).toEqual({
      query: "league_id IN (?, ?, ?)",
      queryParams: [66, 67, 68]
    });
  });

  test("should ignore filters with empty arrays", () => {
    const result = generateQueryWithFilters([{ column: "team_id", value: [] }]);
    expect(result).toEqual({ query: "1=1", queryParams: [] });
  });

  test("should handle AND condition with multiple filters", () => {
    const result = generateQueryWithFilters([
      { column: "season_id", value: [11, 14] },
      { column: "stage", value: [2] }
    ]);
    expect(result).toEqual({
      query: "season_id IN (?, ?) AND stage = ?", // Fixed: "=" for single value
      queryParams: [11, 14, 2]
    });
  });

  test("should handle OR condition with multiple filters", () => {
    const result = generateQueryWithFilters(
      [
        { column: "season_id", value: [11, 14] },
        { column: "stage", value: [2] }
      ],
      "OR"
    );
    expect(result).toEqual({
      query: "season_id IN (?, ?) OR stage = ?", // Fixed: "=" for single value
      queryParams: [11, 14, 2]
    });
  });

  test("should handle nested filter groups", () => {
    const result = generateQueryWithFilters([
      {
        group: {
          operator: "OR",
          filters: [
            { column: "season_id", value: [11] },
            { column: "league_id", value: [66] }
          ]
        }
      },
      { column: "stage", value: [2] }
    ]);
    expect(result).toEqual({
      query: "(season_id = ? OR league_id = ?) AND stage = ?", // Fixed: "=" for single values
      queryParams: [11, 66, 2]
    });
  });

  test("should handle multiple OR columns", () => {
    const result = generateQueryWithFilters([
      { column: [{ column: "team_id" }, { column: "opponent_id" }], value: [3] }
    ]);
    expect(result).toEqual({
      query: "(team_id = ? OR opponent_id = ?)", // Fixed: "=" for single value
      queryParams: [3, 3]
    });
  });

  test("should handle a single value inside an array correctly", () => {
    const result = generateQueryWithFilters([{ column: "map_id", value: [1] }]);
    expect(result).toEqual({ query: "map_id = ?", queryParams: [1] }); // Fixed: "=" instead of "IN"
  });

  test("should handle duplicate filters for the same column", () => {
    const result = generateQueryWithFilters([
      { column: "season_id", value: [11] },
      { column: "season_id", value: [14] }
    ]);
    expect(result).toEqual({
      query: "season_id = ? AND season_id = ?", // Fixed: "=" for single values
      queryParams: [11, 14]
    });
  });
});
