export type MatchSortKey = "newest" | "oldest" | "tier";

const MATCH_SORT_OPTIONS: {
  value: MatchSortKey;
  label: string;
}[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "tier", label: "Highest tier first" }
];

export function getMatchSortKey(
  searchParams: Pick<URLSearchParams, "get">
): MatchSortKey {
  const sort = searchParams.get("sort");
  if (sort === "oldest" || sort === "tier") return sort;
  return "newest";
}

export function cycleMatchSortKey(current: MatchSortKey): MatchSortKey {
  if (current === "newest") return "oldest";
  if (current === "oldest") return "tier";
  return "newest";
}

export function getMatchSortLabel(key: MatchSortKey): string {
  return (
    MATCH_SORT_OPTIONS.find((option) => option.value === key)?.label ??
    "Newest first"
  );
}
