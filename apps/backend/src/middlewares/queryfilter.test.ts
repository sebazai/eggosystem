import { generateQueryWithFilters } from "../utils/queryFilter";

describe("generateQueryWithFilters", () => {
  describe("Basic functionality", () => {
    test("should return '1=1' when no filters are provided", () => {
      const result = generateQueryWithFilters([]);
      expect(result).toEqual({ query: "1=1", queryParams: [] });
    });

    test("should return '1=1' when all filters have null values", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: null },
        { column: "team_id", value: null }
      ]);
      expect(result).toEqual({ query: "1=1", queryParams: [] });
    });

    test("should return '1=1' when all filters have empty arrays", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: [] },
        { column: "team_id", value: [] }
      ]);
      expect(result).toEqual({ query: "1=1", queryParams: [] });
    });

    test("should ignore filters with empty arrays", () => {
      const result = generateQueryWithFilters([
        { column: "team_id", value: [] },
        { column: "season_id", value: [11] }
      ]);
      expect(result).toEqual({ query: "season_id = ?", queryParams: [11] });
    });
  });

  describe("Single column filters", () => {
    test("should generate a simple query for a single value", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: [11] }
      ]);
      expect(result).toEqual({ query: "season_id = ?", queryParams: [11] });
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

    test("should handle string values", () => {
      const result = generateQueryWithFilters([
        { column: "status", value: ["active", "pending"] }
      ]);
      expect(result).toEqual({
        query: "status IN (?, ?)",
        queryParams: ["active", "pending"]
      });
    });

    test("should handle mixed string and number values", () => {
      const result = generateQueryWithFilters([
        { column: "id", value: [1, "2", 3] }
      ]);
      expect(result).toEqual({
        query: "id IN (?, ?, ?)",
        queryParams: [1, "2", 3]
      });
    });
  });

  describe("Multiple filters", () => {
    test("should handle AND condition with multiple filters", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: [11, 14] },
        { column: "stage", value: [2] }
      ]);
      expect(result).toEqual({
        query: "season_id IN (?, ?) AND stage = ?",
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
        query: "season_id IN (?, ?) OR stage = ?",
        queryParams: [11, 14, 2]
      });
    });

    test("should handle three or more filters", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: [11] },
        { column: "team_id", value: [5] },
        { column: "map_id", value: [1, 2] }
      ]);
      expect(result).toEqual({
        query: "season_id = ? AND team_id = ? AND map_id IN (?, ?)",
        queryParams: [11, 5, 1, 2]
      });
    });
  });

  describe("Nested filter groups", () => {
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
        query: "(season_id = ? OR league_id = ?) AND stage = ?",
        queryParams: [11, 66, 2]
      });
    });

    test("should handle deeply nested groups", () => {
      const result = generateQueryWithFilters([
        {
          group: {
            operator: "AND",
            filters: [
              { column: "season_id", value: [11] },
              {
                group: {
                  operator: "OR",
                  filters: [
                    { column: "team_id", value: [5] },
                    { column: "team_id", value: [6] }
                  ]
                }
              }
            ]
          }
        }
      ]);
      expect(result).toEqual({
        query: "(season_id = ? AND (team_id = ? OR team_id = ?))",
        queryParams: [11, 5, 6]
      });
    });

    test("should handle empty nested groups", () => {
      const result = generateQueryWithFilters([
        {
          group: {
            operator: "OR",
            filters: [
              { column: "season_id", value: [] },
              { column: "league_id", value: null }
            ]
          }
        },
        { column: "stage", value: [2] }
      ]);
      expect(result).toEqual({
        query: "(1=1) AND stage = ?",
        queryParams: [2]
      });
    });
  });

  describe("Multiple OR columns", () => {
    test("should handle multiple OR columns with single value", () => {
      const result = generateQueryWithFilters([
        {
          column: [{ column: "team_id" }, { column: "opponent_id" }],
          value: [3]
        }
      ]);
      expect(result).toEqual({
        query: "(team_id = ? OR opponent_id = ?)",
        queryParams: [3, 3]
      });
    });

    test("should handle multiple OR columns with multiple values", () => {
      const result = generateQueryWithFilters([
        {
          column: [{ column: "team_id" }, { column: "opponent_id" }],
          value: [3, 4]
        }
      ]);
      expect(result).toEqual({
        query: "(team_id IN (?, ?) OR opponent_id IN (?, ?))",
        queryParams: [3, 4, 3, 4]
      });
    });

    test("should handle three OR columns", () => {
      const result = generateQueryWithFilters([
        {
          column: [
            { column: "team_id" },
            { column: "opponent_id" },
            { column: "home_team_id" }
          ],
          value: [3]
        }
      ]);
      expect(result).toEqual({
        query: "(team_id = ? OR opponent_id = ? OR home_team_id = ?)",
        queryParams: [3, 3, 3]
      });
    });
  });

  describe("Edge cases", () => {
    test("should handle duplicate filters for the same column", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: [11] },
        { column: "season_id", value: [14] }
      ]);
      expect(result).toEqual({
        query: "season_id = ? AND season_id = ?",
        queryParams: [11, 14]
      });
    });

    test("should handle filters with null and empty values mixed with valid values", () => {
      const result = generateQueryWithFilters([
        { column: "season_id", value: null },
        { column: "team_id", value: [] },
        { column: "map_id", value: [1, 2] },
        { column: "stage", value: [3] }
      ]);
      expect(result).toEqual({
        query: "map_id IN (?, ?) AND stage = ?",
        queryParams: [1, 2, 3]
      });
    });

    test("should handle table aliases correctly", () => {
      const result = generateQueryWithFilters([
        { column: "m.season_id", value: [11] },
        { column: "mg.map_id", value: [1, 2] }
      ]);
      expect(result).toEqual({
        query: "m.season_id = ? AND mg.map_id IN (?, ?)",
        queryParams: [11, 1, 2]
      });
    });
  });

  describe("Operator precedence", () => {
    test("should handle complex nested structures with different operators", () => {
      const result = generateQueryWithFilters([
        {
          group: {
            operator: "OR",
            filters: [
              { column: "season_id", value: [11] },
              { column: "season_id", value: [12] }
            ]
          }
        },
        {
          group: {
            operator: "AND",
            filters: [
              { column: "team_id", value: [5] },
              { column: "map_id", value: [1, 2] }
            ]
          }
        }
      ]);
      expect(result).toEqual({
        query:
          "(season_id = ? OR season_id = ?) AND (team_id = ? AND map_id IN (?, ?))",
        queryParams: [11, 12, 5, 1, 2]
      });
    });
  });

  describe("Future BETWEEN support (placeholder tests)", () => {
    test("should support BETWEEN range filters", () => {
      const result = generateQueryWithFilters([
        { column: "score", between: [10, 20] }
      ]);
      expect(result).toEqual({
        query: "score BETWEEN ? AND ?",
        queryParams: [10, 20]
      });
    });

    test("should handle BETWEEN with single column", () => {
      const result = generateQueryWithFilters([
        { column: "cs2_rank", between: [5, 10] }
      ]);
      expect(result).toEqual({
        query: "cs2_rank BETWEEN ? AND ?",
        queryParams: [5, 10]
      });
    });

    test("should handle BETWEEN mixed with other filters", () => {
      const result = generateQueryWithFilters([
        { column: "cs2_rank", between: [5, 10] },
        { column: "season_id", value: [11] }
      ]);
      expect(result).toEqual({
        query: "cs2_rank BETWEEN ? AND ? AND season_id = ?",
        queryParams: [5, 10, 11]
      });
    });

    test("should handle BETWEEN in nested groups", () => {
      const result = generateQueryWithFilters([
        {
          group: {
            operator: "AND",
            filters: [
              { column: "cs2_rank", between: [5, 10] },
              { column: "season_id", value: [11] }
            ]
          }
        },
        { column: "map_id", value: [1, 2] }
      ]);
      expect(result).toEqual({
        query:
          "(cs2_rank BETWEEN ? AND ? AND season_id = ?) AND map_id IN (?, ?)",
        queryParams: [5, 10, 11, 1, 2]
      });
    });
  });
});
