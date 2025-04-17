import Image from "next/image";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import {
  createNextImageUrl,
  createStatsKanaliigaImageUrl,
  type FilterParamsQuery
} from "@/lib/utils";
import { useLeaderboards } from "@/hooks/data/useLeaderboards";
import { TheContainer } from "../layout/the-container";
import { useRouter } from "next/navigation";

interface LeaderboardsGridProps {
  filterQueryParams: FilterParamsQuery;
}

const formatValue = (value: number, unit: string): string => {
  if (unit === "%") {
    // For percentages, always show 2 decimal places
    return value.toFixed(2);
  } else if (Number.isInteger(value)) {
    // For integers, show no decimal places
    return value.toString();
  } else {
    // For other non-integer values, show 2 decimal places
    return value.toFixed(2);
  }
};

export const LeaderboardsGrid = ({
  filterQueryParams
}: LeaderboardsGridProps) => {
  const router = useRouter();
  const { isError, isLoading, isValidating, leaderboards } =
    useLeaderboards(filterQueryParams);

  if (isLoading || isValidating) {
    return <LeaderboardsGridSkeleton />;
  }

  if (isError) {
    return (
      <TheContainer>
        {isError?.message ?? "Error loading leaderboards"}
      </TheContainer>
    );
  }

  if (!leaderboards || leaderboards.length === 0) {
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
          Leaderboards
        </h1>
        <p className="text-muted-foreground">
          No leaderboard data available for the selected filters. Try changing
          your filter selections.
        </p>
      </div>
    );
  }

  const getImageUrl = (logo?: string) => {
    if (!logo) return "";

    if (logo.startsWith("http://") || logo.startsWith("https://")) {
      return logo;
    }

    // Handle the case where logo is a relative path like "S15_2259.png"
    if (logo.startsWith("S") && logo.includes("_")) {
      return createStatsKanaliigaImageUrl(logo);
    }

    // For logos that start with /, use createNextImageUrl
    if (logo.startsWith("/")) {
      return createNextImageUrl(logo);
    }

    // For any other case, try to make it a valid path
    return `/${logo}`;
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-kanaliiga-orange py-8">
        Leaderboards
      </h1>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        data-testid="leaderboards-grid"
      >
        {leaderboards.map((category, index) => (
          <div
            key={index}
            className="bg-card rounded-sm overflow-hidden"
            data-testid={`leaderboard-category${category.title === "Kana Rating" ? " kana-rating-category" : ""}`}
          >
            <div className="bg-[#2a1810] p-4">
              <h2 className="text-xl font-bold text-kanaliiga-orange">
                {category.title}
              </h2>
            </div>

            <div className="p-4">
              {category.players && category.players.length > 0 ? (
                category.players.map((player, playerIndex) => (
                  <div
                    key={playerIndex}
                    className={`flex items-center justify-between py-3 px-2 ${
                      playerIndex < 3 ? "bg-[#1e1e1e] rounded-sm mb-1" : ""
                    } hover:bg-kanaliiga-light-brown/10 cursor-pointer`}
                    data-testid="player-row"
                    onClick={() => {
                      if (player.steam_id) {
                        router.push(
                          `/players/${encodeURIComponent(player.steam_id)}`
                        );
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span
                        className={`w-6 text-center ${
                          playerIndex === 0
                            ? "text-yellow-400 font-bold"
                            : playerIndex === 1
                              ? "text-muted-foreground font-bold"
                              : playerIndex === 2
                                ? "text-amber-700 font-bold"
                                : "text-muted-foreground"
                        }`}
                        data-testid="player-rank"
                      >
                        {playerIndex === 0
                          ? "👑"
                          : playerIndex === 1
                            ? "🥈"
                            : playerIndex === 2
                              ? "🥉"
                              : `#${player.rank || playerIndex + 1}`}
                      </span>

                      <div className="flex items-center gap-2">
                        {playerIndex === 0 && player.team_logo && (
                          <Image
                            src={getImageUrl(player.team_logo)}
                            alt={player.team_name || ""}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <span
                            className={`${
                              playerIndex < 3
                                ? "font-bold text-white"
                                : "text-muted-foreground"
                            }`}
                            data-testid="player-name"
                          >
                            {player.nickname}
                          </span>
                          <span className="text-muted-foreground text-sm ml-2">
                            {player.team_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className="text-muted-foreground text-sm"
                        data-testid="player-matches"
                      >
                        {player.matches_played} matches
                      </span>
                      <span
                        className={`w-16 text-right ${
                          playerIndex < 3
                            ? "font-bold text-white"
                            : "text-muted-foreground"
                        }`}
                        data-testid="player-value"
                      >
                        {typeof player.value === "number"
                          ? formatValue(player.value, category.unit)
                          : player.value}
                        {category.unit}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No data available for this category
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const LeaderboardsGridSkeleton = () => {
  return (
    <>
      <Skeleton className="h-10 w-72 my-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card rounded-sm overflow-hidden">
            <div className="bg-[#2a1810] p-4">
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="p-4">
              {Array.from({ length: 5 }).map((_, playerIndex) => (
                <div
                  key={playerIndex}
                  className={`flex items-center justify-between py-3 px-2 ${
                    playerIndex < 3 ? "bg-[#1e1e1e] rounded-sm mb-1" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-6 w-6" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
