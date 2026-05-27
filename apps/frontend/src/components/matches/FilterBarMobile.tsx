"use client";

import { useState } from "react";
import { ArrowDownUp, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import type { FilterParamsQuery } from "@/lib/utils";
import type { Season, League, Stage, Team, Map } from "@eggosystem/types";
import { formatLeagueName } from "@/lib/matches/tiers";
import { cycleMatchSortKey, getMatchSortKey } from "@/lib/matches/sort";
import { FilterSheet } from "./FilterSheet";

interface FilterBarMobileProps {
  filterParams: FilterParamsQuery;
}

interface ActiveChip {
  label: string;
  onRemove: () => void;
}

export function FilterBarMobile({ filterParams }: FilterBarMobileProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { data: seasons } = useSWR<Season[]>(
    "/api/v1/seasons",
    expressFetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const { data: leagues } = useSWR<League[]>(
    "/api/v1/leagues",
    expressFetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const { data: stages } = useSWR<Stage[]>("/api/v1/stages", expressFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const { data: maps } = useSWR<Map[]>("/api/v1/maps", expressFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const { data: teams } = useSWR<Team[]>("/api/v1/teams", expressFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });

  function removeFilter(key: string, id: number) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key).map(Number);
    params.delete(key);
    current
      .filter((x) => x !== id)
      .forEach((x) => params.append(key, String(x)));
    router.replace(`${pathname}?${params.toString()}`);
  }

  function cycleSort() {
    const next = cycleMatchSortKey(getMatchSortKey(searchParams));
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  // Build active chip list (excluding default season from count)
  const activeChips: ActiveChip[] = [];

  (filterParams.seasons ?? []).forEach((id) => {
    const s = seasons?.find((x) => x.id === id);
    if (s) {
      activeChips.push({
        label: s.full_name.replace("CS2 Season ", "S"),
        onRemove: () => removeFilter("seasons", id)
      });
    }
  });
  (filterParams.leagues ?? []).forEach((id) => {
    const l = leagues?.find((x) => x.id === id);
    if (l) {
      activeChips.push({
        label: formatLeagueName(l.name),
        onRemove: () => removeFilter("leagues", id)
      });
    }
  });
  (filterParams.stages ?? []).forEach((id) => {
    const s = stages?.find((x) => x.id === id);
    if (s) {
      activeChips.push({
        label: s.name,
        onRemove: () => removeFilter("stages", id)
      });
    }
  });
  (filterParams.maps ?? []).forEach((id) => {
    const m = maps?.find((x) => x.id === id);
    if (m) {
      activeChips.push({
        label: m.name,
        onRemove: () => removeFilter("maps", id)
      });
    }
  });
  (filterParams.teams ?? []).forEach((id) => {
    const t = teams?.find((x) => x.id === id);
    if (t) {
      activeChips.push({
        label: t.name,
        onRemove: () => removeFilter("teams", id)
      });
    }
  });

  const activeCount =
    (filterParams.seasons?.length ?? 0) +
    (filterParams.leagues?.length ?? 0) +
    (filterParams.stages?.length ?? 0) +
    (filterParams.maps?.length ?? 0) +
    (filterParams.teams?.length ?? 0);

  return (
    <div className="w-full min-w-0 md:hidden">
      {/* Filters button row */}
      <div className="flex gap-2">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-kanaliiga-orange/50 bg-kanaliiga-orange/12 px-4 py-2.5 font-headings text-[13px] uppercase tracking-[0.08em] text-kanaliiga-orange transition-colors hover:bg-kanaliiga-orange/18"
        >
          <SlidersHorizontal size={14} strokeWidth={1.5} />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-kanaliiga-orange font-mono text-[10px] font-bold text-kanaliiga-dark-gray">
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={cycleSort}
          aria-label="Cycle sort order"
          className="flex size-11 flex-shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"
        >
          <ArrowDownUp size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Active chip row */}
      {activeChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full border border-white/16 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-foreground"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
              >
                <X size={10} strokeWidth={1.5} />
              </button>
            </span>
          ))}
          <button
            onClick={() => router.replace(pathname)}
            className="ml-auto font-mono text-[10px] text-muted-foreground underline-offset-2 hover:text-kanaliiga-orange hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filterParams={filterParams}
      />
    </div>
  );
}
