"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { LeagueSelector } from "@/components/standings/LeagueSelector";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { useStandings } from "@/hooks/data/useStandings";
import { useStandingLeagues } from "@/hooks/data/useStandingLeagues";

export default function StandingsPage({ seasonId }: { seasonId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    standingsLeagues,
    isLoading: isLoadingLeagues,
    isError: isErrorLeagues
  } = useStandingLeagues(seasonId);

  // Get league from URL params or default to Masters A
  const initialLeague = searchParams.get("league");

  // Determine the selected league: URL param first, then default to tier 1 league
  const selectedLeague =
    initialLeague ||
    (standingsLeagues.length > 0
      ? standingsLeagues.find((league) => league.tier === 1)?.external_id
      : null);

  // Fetch standings data
  const { standings, isLoading, isError } = useStandings(
    selectedLeague || undefined
  );

  // Update URL when league changes
  const handleLeagueChange = (leagueId: string) => {
    const league = standingsLeagues.find(
      (league) => league.external_id === leagueId
    );

    if (!league) {
      return;
    }

    // Update URL with new league parameter
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("league", leagueId);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  // Get the current league name for display
  const currentLeague = standingsLeagues.find(
    (league) => league.external_id === selectedLeague
  );

  if (isErrorLeagues) {
    return <div>Error loading leagues list</div>;
  }

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
              selectedLeague={currentLeague || null}
              onLeagueChange={handleLeagueChange}
              allLeagues={standingsLeagues}
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

  if (isLoadingLeagues || isLoading) {
    return (
      <div>
        <AutoBreadcrumbs />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">League Standings</h1>
            <p className="text-muted-foreground mt-2">
              Loading league standings...
            </p>
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
            {currentLeague?.league_name}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">League:</span>
            <LeagueSelector
              selectedLeague={currentLeague || null}
              onLeagueChange={handleLeagueChange}
              allLeagues={standingsLeagues}
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
            <p>
              <strong>Forfeit:</strong> 3 points for winner, 0 points for loser,
              7 rounds for winner, 0 rounds for loser
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
