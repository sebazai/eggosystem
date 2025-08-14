import type { Nullable } from "@eggosystem/types";

interface FilterGroup {
  operator: "AND" | "OR";
  filters: Filter[];
}

export type Filter =
  | {
      column: string;
      value?: Nullable<Array<string | number>>;
      between?: [number, number];
    } // Single column filter or BETWEEN
  | {
      column: Array<{ column: string }>;
      value: Nullable<Array<string | number>>;
    } // Multiple OR columns
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
    } else if (
      typeof filter.column === "string" &&
      (filter as { between?: [number, number] }).between
    ) {
      // BETWEEN support
      const between = (filter as { between: [number, number] }).between;
      queryParts.push(`${filter.column} BETWEEN ? AND ?`);
      queryParams.push(between[0], between[1]);
    } else if (
      filter.value !== null &&
      filter.value !== undefined &&
      filter.value.length > 0
    ) {
      if (Array.isArray(filter.column)) {
        // Handle multiple OR columns
        if (filter.value.length === 1) {
          // Use '=' instead of IN when only one value exists
          const orConditions = filter.column
            .map((c) => `${c.column} = ?`)
            .join(" OR ");
          queryParts.push(`(${orConditions})`);
          queryParams.push(
            ...Array(filter.column.length).fill(filter.value[0])
          );
        } else {
          // Use IN clause for multiple values
          const orConditions = filter.column
            .map(
              (c) =>
                `${c.column} IN (${filter.value!.map(() => "?").join(", ")})`
            )
            .join(" OR ");
          queryParts.push(`(${orConditions})`);
          // For each column, push the full value array
          filter.column.forEach(() => {
            queryParams.push(...filter.value!);
          });
        }
      } else {
        // Single column filter
        if (filter.value.length === 1) {
          queryParts.push(`${filter.column} = ?`);
          queryParams.push(filter.value[0]);
        } else {
          queryParts.push(
            `${filter.column} IN (${filter.value.map(() => "?").join(", ")})`
          );
          queryParams.push(...filter.value);
        }
      }
    }
  });

  return {
    query:
      queryParts.length > 0 ? queryParts.join(` ${parentOperator} `) : "1=1",
    queryParams
  };
};
