"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { LeagueSelector } from "@/components/standings/LeagueSelector";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { useStandings } from "@/hooks/data/useStandings";
import { LEAGUES } from "@/types/standings";

export default function StandingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get league from URL params or default to Masters A
  const initialLeague =
    searchParams.get("league") || "fe4cb0c3-9934-484c-84d1-662acdb025d4";
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);

  // Fetch standings data
  const { standings, isLoading, isError } = useStandings(selectedLeague);

  // Update URL when league changes
  const handleLeagueChange = (leagueId: string) => {
    setSelectedLeague(leagueId);

    // Update URL with new league parameter
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("league", leagueId);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  // Update selected league when URL changes
  useEffect(() => {
    const urlLeague = searchParams.get("league");
    if (urlLeague && urlLeague !== selectedLeague) {
      setSelectedLeague(urlLeague);
    }
  }, [searchParams, selectedLeague]);

  // Get the current league name for display
  const currentLeagueName =
    LEAGUES.find((league) => league.id === selectedLeague)?.name ||
    "Unknown League";

  if (isError) {
    return (
      <div>
        <AutoBreadcrumbs />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">League Standings</h1>
            <p className="text-muted-foreground mt-2">
              View current league standings and team performance
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <LeagueSelector
              selectedLeague={selectedLeague}
              onLeagueChange={handleLeagueChange}
            />
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">
                Failed to load standings
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later or select a different league
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AutoBreadcrumbs />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">League Standings</h1>
          <p className="text-muted-foreground mt-2">
            View current league standings and team performance for{" "}
            {currentLeagueName}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">League:</span>
            <LeagueSelector
              selectedLeague={selectedLeague}
              onLeagueChange={handleLeagueChange}
            />
          </div>
        </div>

        <StandingsTable data={standings} isLoading={isLoading} />

        {!isLoading && standings.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Scoring System:</strong> 3 points for regular win, 2
              points for overtime win, 1 point for overtime loss, 0 points for
              regular loss
            </p>
            <p className="mt-1">
              Teams are sorted by points first, then by round difference
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
