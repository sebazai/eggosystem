"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { expressFetcher, cn } from "@/lib/utils";
import { leagueColor, formatLeagueName } from "@/lib/matches/tiers";
import type { FilterParamsQuery } from "@/lib/utils";
import type { Season, League, Stage, Map } from "@eggosystem/types";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterParams: FilterParamsQuery;
}

type ActiveFilters = {
  seasons: number[];
  leagues: number[];
  stages: number[];
  maps: number[];
};

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function Section({ label, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}

function Chip({ label, active, onClick, dotColor }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[12px] transition-colors",
        active
          ? "border-kanaliiga-orange/60 bg-kanaliiga-orange/16 text-kanaliiga-orange"
          : "border-white/12 bg-white/[0.04] text-foreground hover:bg-white/[0.07]"
      )}
    >
      {dotColor && (
        <span
          className="size-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {label}
    </button>
  );
}

export function FilterSheet({
  open,
  onOpenChange,
  filterParams
}: FilterSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for optimistic chip active states
  const [local, setLocal] = useState<ActiveFilters>({
    seasons: filterParams.seasons ?? [],
    leagues: filterParams.leagues ?? [],
    stages: filterParams.stages ?? [],
    maps: filterParams.maps ?? []
  });

  // Sync local state only when the sheet opens
  useEffect(() => {
    if (!open) return;
    setLocal({
      seasons: filterParams.seasons ?? [],
      leagues: filterParams.leagues ?? [],
      stages: filterParams.stages ?? [],
      maps: filterParams.maps ?? []
    });
    // filterParams intentionally omitted — only reset on open
  }, [open]);

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

  function applyFilters(next: ActiveFilters) {
    const params = new URLSearchParams(searchParams.toString());
    (["seasons", "leagues", "stages", "maps"] as const).forEach((key) => {
      params.delete(key);
      next[key].forEach((id) => params.append(key, String(id)));
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggle(key: keyof ActiveFilters, id: number) {
    const next: ActiveFilters = {
      ...local,
      [key]: local[key].includes(id)
        ? local[key].filter((x) => x !== id)
        : [...local[key], id]
    };
    setLocal(next);
    applyFilters(next);
  }

  function clearAll() {
    const next: ActiveFilters = {
      seasons: [],
      leagues: [],
      stages: [],
      maps: []
    };
    setLocal(next);
    applyFilters(next);
  }

  // Swipe-to-close gesture
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef<number | null>(null);

  function handleDragTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartY.current = touch.clientY;
    setDragY(0);
  }

  function handleDragTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const delta = touch.clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  }

  function handleDragTouchEnd() {
    if (dragY > 80) {
      onOpenChange(false);
    }
    touchStartY.current = null;
    setDragY(0);
  }

  const totalActive =
    local.seasons.length +
    local.leagues.length +
    local.stages.length +
    local.maps.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="rounded-t-2xl border-0 bg-[hsl(240_3%_9%)] px-0 pb-0 pt-0 max-h-[85dvh] flex flex-col"
        style={{
          borderTop: "2px solid var(--kanaliiga-orange)",
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? "none" : undefined
        }}
      >
        {/* Drag handle — touch handlers here drive swipe-to-close */}
        <div
          className="flex justify-center pb-1 pt-3 touch-none"
          onTouchStart={handleDragTouchStart}
          onTouchMove={handleDragTouchMove}
          onTouchEnd={handleDragTouchEnd}
        >
          <span className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 pb-3">
          <h2 className="font-headings text-[20px] text-kanaliiga-light-brown">
            Filters
          </h2>
          <SheetClose className="flex size-8 items-center justify-center rounded-md border border-white/16 text-muted-foreground hover:border-white/30 hover:text-foreground transition-colors">
            <X size={14} strokeWidth={1.5} />
          </SheetClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {seasons && seasons.length > 0 && (
            <Section label="Season">
              {[...seasons]
                .sort((a, b) => b.id - a.id)
                .map((s) => (
                  <Chip
                    key={s.id}
                    label={s.full_name}
                    active={local.seasons.includes(s.id)}
                    onClick={() => toggle("seasons", s.id)}
                  />
                ))}
            </Section>
          )}

          {leagues && leagues.length > 0 && (
            <Section label="League">
              {[...leagues]
                .sort((a, b) => a.sort_priority - b.sort_priority)
                .map((l) => (
                  <Chip
                    key={l.id}
                    label={formatLeagueName(l.name)}
                    active={local.leagues.includes(l.id)}
                    onClick={() => toggle("leagues", l.id)}
                    dotColor={leagueColor(l.name).color}
                  />
                ))}
            </Section>
          )}

          {stages && stages.length > 0 && (
            <Section label="Stage">
              {stages.map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  active={local.stages.includes(s.id)}
                  onClick={() => toggle("stages", s.id)}
                />
              ))}
            </Section>
          )}

          {maps && maps.length > 0 && (
            <Section label="Map">
              {maps.map((m) => (
                <Chip
                  key={m.id}
                  label={m.name}
                  active={local.maps.includes(m.id)}
                  onClick={() => toggle("maps", m.id)}
                />
              ))}
            </Section>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex gap-3 border-t border-white/8 bg-black/40 px-5 py-3">
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 rounded-md border border-white/16 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-[2] rounded-md bg-kanaliiga-orange py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-kanaliiga-dark-gray transition-opacity hover:opacity-90"
          >
            Show results{totalActive > 0 ? ` (${totalActive})` : ""}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
