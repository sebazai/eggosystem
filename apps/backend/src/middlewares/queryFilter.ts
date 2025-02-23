import type { Nullable } from "@eggosystem/types";

interface FilterGroup {
  operator: "AND" | "OR";
  filters: Filter[];
}

export type Filter =
  | { column: string; value: Nullable<number | string> } // Single column filter
  | { column: Array<{ column: string }>; value: Nullable<number | string> } // Multiple OR columns
  | { group: FilterGroup }; // Nested AND/OR groups

interface QueryAndWithQueryParams {
  query: string;
  queryParams: (string | number)[];
}

export const generateQueryWithFilters = (
  filters: Filter[],
  parentOperator: "AND" | "OR" = "AND"
): QueryAndWithQueryParams => {
  const queryParts: string[] = [];
  const queryParams: (string | number)[] = [];

  filters.forEach((filter) => {
    if ("group" in filter) {
      // Recursively process nested groups
      const nestedResult = generateQueryWithFilters(
        filter.group.filters,
        filter.group.operator
      );
      if (nestedResult.query) {
        queryParts.push(`(${nestedResult.query})`);
        queryParams.push(...nestedResult.queryParams);
      }
    } else if (filter.value !== null) {
      if (Array.isArray(filter.column)) {
        // Combine multiple OR conditions into a single clause
        const orConditions = filter.column
          .map((c) => `${c.column} = ?`)
          .join(" OR ");
        queryParts.push(`(${orConditions})`);
        queryParams.push(...Array(filter.column.length).fill(filter.value));
      } else {
        queryParts.push(`${filter.column} = ?`);
        queryParams.push(filter.value);
      }
    }
  });

  return {
    query: queryParts.length > 0 ? queryParts.join(` ${parentOperator} `) : "",
    queryParams
  };
};
