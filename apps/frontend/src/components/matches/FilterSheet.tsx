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

type PendingFilters = {
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
  const isClosingRef = useRef(false);

  const [pending, setPending] = useState<PendingFilters>({
    seasons: filterParams.seasons ?? [],
    leagues: filterParams.leagues ?? [],
    stages: filterParams.stages ?? [],
    maps: filterParams.maps ?? []
  });

  // Sync pending state only when the sheet opens (not on URL updates while closing)
  useEffect(() => {
    if (!open) return;
    setPending({
      seasons: filterParams.seasons ?? [],
      leagues: filterParams.leagues ?? [],
      stages: filterParams.stages ?? [],
      maps: filterParams.maps ?? []
    });
    // filterParams intentionally omitted — only reset draft when opening
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

  function toggle(key: keyof PendingFilters, id: number) {
    setPending((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((x) => x !== id)
        : [...prev[key], id]
    }));
  }

  function clearAll() {
    setPending({ seasons: [], leagues: [], stages: [], maps: [] });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isClosingRef.current && nextOpen) return;
    onOpenChange(nextOpen);
  }

  function commit() {
    const params = new URLSearchParams(searchParams.toString());
    // Preserve non-filter params (like sort)
    (["seasons", "leagues", "stages", "maps"] as const).forEach((key) => {
      params.delete(key);
      pending[key].forEach((id) => params.append(key, String(id)));
    });
    const nextUrl = `${pathname}?${params.toString()}`;

    isClosingRef.current = true;
    onOpenChange(false);
    router.replace(nextUrl, { scroll: false });
    window.setTimeout(() => {
      isClosingRef.current = false;
    }, 350);
  }

  const totalActive =
    pending.seasons.length +
    pending.leagues.length +
    pending.stages.length +
    pending.maps.length;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="rounded-t-2xl border-0 bg-[hsl(240_3%_9%)] px-0 pb-0 pt-0 max-h-[85dvh] flex flex-col"
        style={{ borderTop: "2px solid var(--kanaliiga-orange)" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
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
                    active={pending.seasons.includes(s.id)}
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
                    active={pending.leagues.includes(l.id)}
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
                  active={pending.stages.includes(s.id)}
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
                  active={pending.maps.includes(m.id)}
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
            onClick={commit}
            className="flex-[2] rounded-md bg-kanaliiga-orange py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-kanaliiga-dark-gray transition-opacity hover:opacity-90"
          >
            Show{totalActive > 0 ? ` (${totalActive} active)` : ""} Matches
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
