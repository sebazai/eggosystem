"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { expressFetcher, cn, type FilterParamsQuery } from "@/lib/utils";
import { leagueColor, formatLeagueName } from "@/lib/matches/tiers";
import type { MatchesByFilters, Season, League } from "@eggosystem/types";

type SortKey = "newest" | "oldest" | "tier";

interface SummaryStripProps {
  matches: MatchesByFilters[];
  showSeasonCounts?: boolean;
  filterParams: FilterParamsQuery;
}

function findLeagueId(
  leagueName: string,
  leagues: League[]
): number | undefined {
  return leagues.find((l) => l.name.toLowerCase() === leagueName.toLowerCase())
    ?.id;
}

function hasUserFilters(filterParams: FilterParamsQuery): boolean {
  return [
    filterParams.leagues,
    filterParams.stages,
    filterParams.teams,
    filterParams.maps
  ].some((value) => value && value.length > 0);
}

export function SummaryStrip({
  matches,
  showSeasonCounts = false,
  filterParams
}: SummaryStripProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { data: seasons } = useSWR<Season[]>(
    "/api/v1/seasons",
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );
  const { data: leagues } = useSWR<League[]>(
    "/api/v1/leagues",
    expressFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true
    }
  );

  const seasonLabelMap = (seasons ?? []).reduce<Record<number, string>>(
    (acc, s) => {
      acc[s.id] = s.full_name.replace(/Season\s+/i, "S");
      return acc;
    },
    {}
  );

  // name → sort_priority for ordering the league breakdown
  const leagueSortMap = (leagues ?? []).reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.name.toLowerCase()] = l.sort_priority;
      return acc;
    },
    {}
  );

  const currentSort = (searchParams.get("sort") as SortKey | null) ?? "newest";

  // Group match counts by actual league_name from DB
  const leagueCounts = matches.reduce<Record<string, number>>((acc, m) => {
    acc[m.league_name] = (acc[m.league_name] ?? 0) + 1;
    return acc;
  }, {});

  // Sort leagues by sort_priority (DB-driven), then by name for stability
  const presentLeagues = Object.keys(leagueCounts).sort((a, b) => {
    const pa = leagueSortMap[a.toLowerCase()] ?? 999;
    const pb = leagueSortMap[b.toLowerCase()] ?? 999;
    return pa !== pb ? pa - pb : a.localeCompare(b);
  });

  const seasonCounts = showSeasonCounts
    ? matches.reduce<Record<string, number>>((acc, m) => {
        const sid = String(m.season_id);
        acc[sid] = (acc[sid] ?? 0) + 1;
        return acc;
      }, {})
    : null;

  function handleSort(value: SortKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setFilterParam(key: "leagues" | "seasons", id: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.append(key, String(id));
    router.replace(`${pathname}?${params.toString()}`);
  }

  const filtersAreLinkable = !hasUserFilters(filterParams);

  return (
    <div className="mb-4 w-full min-w-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Showing{" "}
          <span className="font-bold text-foreground">{matches.length}</span>{" "}
          {matches.length === 1 ? "match" : "matches"}
        </span>

        {presentLeagues.length > 0 && (
          <span className="h-4 w-px self-stretch bg-white/10" />
        )}

        <div className="flex flex-wrap gap-3">
          {presentLeagues.map((name) => {
            const leagueId = findLeagueId(name, leagues ?? []);
            const isLink = filtersAreLinkable && leagueId != null;
            const content = (
              <>
                <span
                  className="size-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: leagueColor(name).color
                  }}
                />
                <span
                  className={cn(
                    "text-muted-foreground",
                    isLink && "group-hover:text-kanaliiga-orange"
                  )}
                >
                  {formatLeagueName(name)}
                </span>
                <span
                  className={cn(
                    "font-bold text-foreground",
                    isLink && "group-hover:text-kanaliiga-orange"
                  )}
                >
                  {leagueCounts[name]}
                </span>
              </>
            );

            if (!isLink) {
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px]"
                >
                  {content}
                </span>
              );
            }

            return (
              <button
                key={name}
                type="button"
                onClick={() => setFilterParam("leagues", leagueId)}
                className="group inline-flex items-center gap-1.5 rounded-sm font-mono text-[10px] transition-colors hover:text-kanaliiga-orange"
              >
                {content}
              </button>
            );
          })}
        </div>

        {seasonCounts && Object.keys(seasonCounts).length > 0 && (
          <>
            <span className="h-4 w-px self-stretch bg-white/10" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(seasonCounts)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([sid, count]) => {
                  const seasonId = Number(sid);
                  const isLink =
                    filtersAreLinkable && Number.isFinite(seasonId);
                  const label = seasonLabelMap[seasonId] ?? `S${sid}`;
                  const content = (
                    <>
                      <span className="inline-flex items-center rounded-full border border-kanaliiga-light-brown/40 bg-kanaliiga-light-brown/15 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] text-kanaliiga-light-brown group-hover:border-kanaliiga-orange/50 group-hover:text-kanaliiga-orange">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "font-bold text-foreground",
                          isLink && "group-hover:text-kanaliiga-orange"
                        )}
                      >
                        {count}
                      </span>
                    </>
                  );

                  if (!isLink) {
                    return (
                      <span
                        key={sid}
                        className="inline-flex items-center gap-1 font-mono text-[10px]"
                      >
                        {content}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={sid}
                      type="button"
                      onClick={() => setFilterParam("seasons", seasonId)}
                      className="group inline-flex items-center gap-1 rounded-sm font-mono text-[10px] transition-colors hover:text-kanaliiga-orange"
                    >
                      {content}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
        <span className="uppercase tracking-[0.12em]">Sort by</span>
        <select
          value={currentSort}
          onChange={(e) => handleSort(e.target.value as SortKey)}
          className="rounded border border-white/8 bg-transparent px-1.5 py-0.5 text-[10px] text-foreground outline-none focus:border-kanaliiga-orange/60"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="tier">Highest tier first</option>
        </select>
      </label>
    </div>
  );
}
