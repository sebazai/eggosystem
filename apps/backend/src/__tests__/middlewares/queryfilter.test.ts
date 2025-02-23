import {
  Filter,
  generateQueryWithFilters,
} from "../../middlewares/queryFilter";

describe("generateQueryWithFilters", () => {
  test("should return an empty query when no filters are provided", () => {
    const result = generateQueryWithFilters([]);
    expect(result).toEqual({ query: "", queryParams: [] });
  });

  test("should generate query for a single filter", () => {
    const filters = [{ column: "age", value: 30 }];
    const result = generateQueryWithFilters(filters);
    expect(result).toEqual({ query: "age = ?", queryParams: [30] });
  });

  test("should ignore filters with null values", () => {
    const filters = [
      { column: "age", value: 30 },
      { column: "name", value: null },
    ];
    const result = generateQueryWithFilters(filters);
    expect(result).toEqual({ query: "age = ?", queryParams: [30] });
  });

  test("should generate query for multiple filters with AND", () => {
    const filters = [
      { column: "age", value: 30 },
      { column: "salary", value: 5000 },
    ];
    const result = generateQueryWithFilters(filters, "AND");
    expect(result).toEqual({
      query: "age = ? AND salary = ?",
      queryParams: [30, 5000],
    });
  });

  test("should generate query for multiple filters with OR", () => {
    const filters = [
      { column: "age", value: 30 },
      { column: "salary", value: 5000 },
    ];
    const result = generateQueryWithFilters(filters, "OR");
    expect(result).toEqual({
      query: "age = ? OR salary = ?",
      queryParams: [30, 5000],
    });
  });

  test("should handle filters with multiple OR columns", () => {
    const filters = [
      { column: [{ column: "age" }, { column: "years" }], value: 30 },
    ];
    const result = generateQueryWithFilters(filters);
    expect(result).toEqual({
      query: "(age = ? OR years = ?)",
      queryParams: [30, 30],
    });
  });

  test("should handle nested filter groups", () => {
    const filters = [
      {
        group: {
          operator: "OR",
          filters: [
            { column: "age", value: 30 },
            { column: "salary", value: 5000 },
          ],
        },
      },
      { column: "status", value: "active" },
    ] satisfies Filter[];
    const result = generateQueryWithFilters(filters, "AND");
    expect(result).toEqual({
      query: "(age = ? OR salary = ?) AND status = ?",
      queryParams: [30, 5000, "active"],
    });
  });

  test("should handle deeply nested filter groups", () => {
    const filters = [
      {
        group: {
          operator: "AND",
          filters: [
            { column: "age", value: 30 },
            {
              group: {
                operator: "OR",
                filters: [
                  { column: "salary", value: 5000 },
                  { column: "bonus", value: 1000 },
                ],
              },
            },
          ],
        },
      },
    ] satisfies Filter[];
    const result = generateQueryWithFilters(filters);
    expect(result).toEqual({
      query: "(age = ? AND (salary = ? OR bonus = ?))",
      queryParams: [30, 5000, 1000],
    });
  });
});
