"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { expressFetcher, cn } from "@/lib/utils";
import { leagueColor, formatLeagueName } from "@/lib/matches/tiers";
import {
  getMatchSortKey,
  getMatchSortLabel,
  MATCH_SORT_OPTIONS,
  type MatchSortKey
} from "@/lib/matches/sort";
import type { FilterParamsQuery } from "@/lib/utils";
import type { Season, League, Stage, Team, Map } from "@eggosystem/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useMultiFilterSelectables } from "@/hooks/data/useMultiFilterSelectables";

type FacetKey = "seasons" | "leagues" | "stages" | "teams" | "maps";

interface FacetItem {
  id: number;
  label: string;
}

interface FacetPopoverProps {
  label: string;
  selectedIds: number[];
  items: FacetItem[];
  availableIds: number[] | undefined;
  onToggle: (id: number) => void;
  dotColor?: (id: number) => string | undefined;
}

function FacetChip({
  children,
  onRemove
}: {
  children: ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-kanaliiga-orange/40 bg-kanaliiga-orange/18 px-1.5 py-0.5 text-[10px] text-kanaliiga-orange">
      {children}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onRemove();
          }
        }}
        className="cursor-pointer rounded-full hover:text-kanaliiga-orange"
      >
        <X size={8} />
      </span>
    </span>
  );
}

function FacetPopover({
  label,
  selectedIds,
  items,
  availableIds,
  onToggle,
  dotColor
}: FacetPopoverProps) {
  const [open, setOpen] = useState(false);

  const available = availableIds
    ? items.filter((item) => availableIds.includes(item.id))
    : items;

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const hasSelection = selectedItems.length > 0;
  const maxVisibleChips = selectedItems.length > 2 ? 1 : 2;
  const visibleChips = selectedItems.slice(0, maxVisibleChips);
  const overflowCount = selectedItems.length - visibleChips.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-md border px-3 font-mono text-[11px] transition-colors",
            hasSelection
              ? "border-kanaliiga-orange/40 text-foreground"
              : "border-kanaliiga-light-brown/40 text-muted-foreground hover:border-kanaliiga-light-brown/70 hover:text-foreground"
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
            {!hasSelection ? (
              <span className="truncate uppercase tracking-[0.08em]">
                {label}
              </span>
            ) : (
              <>
                {visibleChips.map((item) => (
                  <FacetChip key={item.id} onRemove={() => onToggle(item.id)}>
                    {item.label}
                  </FacetChip>
                ))}
                {overflowCount > 0 && (
                  <span className="shrink-0 rounded-full border border-kanaliiga-orange/40 bg-kanaliiga-orange/18 px-1.5 py-0.5 text-[10px] text-kanaliiga-orange">
                    +{overflowCount}
                  </span>
                )}
              </>
            )}
          </span>
          <ChevronDown size={12} strokeWidth={1.5} className="shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-30 w-52 p-0 border-white/8 bg-[hsl(240_3%_11%)]"
      >
        <div className="max-h-60 overflow-y-auto py-1">
          {available.length === 0 && (
            <p className="px-3 py-2 font-mono text-[10px] text-muted-foreground">
              No options available
            </p>
          )}
          {available.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const color = dotColor?.(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] transition-colors hover:bg-white/5",
                  isSelected ? "text-kanaliiga-orange" : "text-foreground"
                )}
              >
                {color && (
                  <span
                    className="size-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="flex-1 text-left">{item.label}</span>
                {isSelected && (
                  <span className="size-3 rounded-full bg-kanaliiga-orange/20 text-kanaliiga-orange flex items-center justify-center text-[8px]">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortPopover({
  sort,
  onSelect
}: {
  sort: MatchSortKey;
  onSelect: (value: MatchSortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const isNonDefault = sort !== "newest";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="Sort matches"
          className={cn(
            "flex h-9 w-40 shrink-0 items-center justify-between gap-1.5 rounded-md border px-3 font-mono text-[11px] transition-colors",
            isNonDefault
              ? "border-kanaliiga-orange/40 text-foreground"
              : "border-kanaliiga-light-brown/40 text-muted-foreground hover:border-kanaliiga-light-brown/70 hover:text-foreground"
          )}
        >
          <span className="truncate uppercase tracking-[0.08em]">
            {getMatchSortLabel(sort)}
          </span>
          <ChevronDown size={12} strokeWidth={1.5} className="shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-30 w-52 p-0 border-white/8 bg-[hsl(240_3%_11%)]"
      >
        <div className="py-1">
          {MATCH_SORT_OPTIONS.map((option) => {
            const isSelected = sort === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] transition-colors hover:bg-white/5",
                  isSelected ? "text-kanaliiga-orange" : "text-foreground"
                )}
              >
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && (
                  <span className="size-3 rounded-full bg-kanaliiga-orange/20 text-kanaliiga-orange flex items-center justify-center text-[8px]">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FilterBarDesktopProps {
  filterParams: FilterParamsQuery;
}

export function FilterBarDesktop({ filterParams }: FilterBarDesktopProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const { multiFilterSelectData } = useMultiFilterSelectables(filterParams);

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
  const { data: teams } = useSWR<Team[]>("/api/v1/teams", expressFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const { data: maps } = useSWR<Map[]>("/api/v1/maps", expressFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });

  function setParam(key: FacetKey, ids: number[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    ids.forEach((id) => params.append(key, String(id)));
    router.replace(`${pathname}?${params.toString()}`);
  }

  function toggleItem(key: FacetKey, id: number) {
    const current = filterParams[key] ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setParam(key, next);
  }

  function setSort(value: MatchSortKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const currentSort = getMatchSortKey(searchParams);

  const seasonItems: FacetItem[] = (seasons ?? [])
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((s) => ({ id: s.id, label: s.full_name }));
  const leagueItems: FacetItem[] = (leagues ?? [])
    .slice()
    .sort((a, b) => a.sort_priority - b.sort_priority)
    .map((l) => ({ id: l.id, label: formatLeagueName(l.name) }));
  const stageItems: FacetItem[] = (stages ?? []).map((s) => ({
    id: s.id,
    label: s.name
  }));
  const teamItems: FacetItem[] = (teams ?? [])
    .map((t) => ({ id: t.id, label: t.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const mapItems: FacetItem[] = (maps ?? []).map((m) => ({
    id: m.id,
    label: m.name
  }));

  function leagueDotColor(id: number) {
    const league = leagues?.find((l) => l.id === id);
    if (!league) return undefined;
    return leagueColor(league.name).color;
  }

  return (
    <div className="hidden w-full min-w-0 items-center gap-2 md:flex">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          <FacetPopover
            label="Seasons"
            selectedIds={filterParams.seasons ?? []}
            items={seasonItems}
            availableIds={multiFilterSelectData?.season_ids}
            onToggle={(id) => toggleItem("seasons", id)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <FacetPopover
            label="Leagues"
            selectedIds={filterParams.leagues ?? []}
            items={leagueItems}
            availableIds={multiFilterSelectData?.league_ids}
            onToggle={(id) => toggleItem("leagues", id)}
            dotColor={leagueDotColor}
          />
        </div>
        <div className="min-w-0 flex-1">
          <FacetPopover
            label="Stages"
            selectedIds={filterParams.stages ?? []}
            items={stageItems}
            availableIds={multiFilterSelectData?.stages}
            onToggle={(id) => toggleItem("stages", id)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <FacetPopover
            label="Teams"
            selectedIds={filterParams.teams ?? []}
            items={teamItems}
            availableIds={multiFilterSelectData?.team_ids}
            onToggle={(id) => toggleItem("teams", id)}
          />
        </div>
        <div className="min-w-0 flex-1">
          <FacetPopover
            label="Maps"
            selectedIds={filterParams.maps ?? []}
            items={mapItems}
            availableIds={multiFilterSelectData?.map_ids}
            onToggle={(id) => toggleItem("maps", id)}
          />
        </div>
      </div>

      <SortPopover sort={currentSort} onSelect={setSort} />

      <button
        onClick={() => router.replace(pathname)}
        className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground hover:text-kanaliiga-orange transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}
