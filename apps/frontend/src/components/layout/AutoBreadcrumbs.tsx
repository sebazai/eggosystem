"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import type { MatchesByFilters, SteamPlayer } from "@eggosystem/types";
import { envConfig } from "@/configs/env";

const matchBreadcrumbLabel = (bestOf: number, stage: number) => {
  if (stage === 1) {
    return `BO${bestOf} - Regular`;
  }
  if (stage === 2) {
    return `BO${bestOf} - Playoffs`;
  }

  return undefined;
};

const gameNumBreadcrumbLabel = (gameId: number, matchId: number) => {
  const url = `${envConfig.API_URL}/api/v1/games/${gameId}/matchId/${matchId}`;
  return fetch(url)
    .then((response) => response.json())
    .then((_game) => {
      return `Game ${gameId}`;
    })
    .catch(() => {
      return `Game ${gameId}`;
    });
};

const mapBreadcrumbLabel = (mapId: string) => {
  const url = `${envConfig.API_URL}/api/v1/maps/${mapId}`;
  return fetch(url)
    .then((response) => response.json())
    .then((map: { name?: string }) => {
      return map.name || mapId;
    })
    .catch(() => {
      return mapId;
    });
};

const fetchLabelFor = async (resource: string, id: string): Promise<string> => {
  if (resource === "matches") {
    const url = `${envConfig.API_URL}/api/v1/matches/${id}`;
    return fetch(url)
      .then((response) => response.json())
      .then((match: MatchesByFilters) => {
        // Using match_id in place of best_of as a fallback
        const matchLabel = matchBreadcrumbLabel(match.match_id, match.stage);
        if (matchLabel && match.team1_name && match.team2_name) {
          return `${match.team1_name} vs ${match.team2_name} (${matchLabel})`;
        }
        return match.team1_name && match.team2_name
          ? `${match.team1_name} vs ${match.team2_name}`
          : id;
      })
      .catch(() => {
        return id;
      });
  } else if (resource === "maps") {
    return mapBreadcrumbLabel(id);
  } else if (resource === "games" && id.includes("-")) {
    const parts = id.split("-");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return gameNumBreadcrumbLabel(parseInt(parts[0]), parseInt(parts[1]));
    }
    return `Game ${id}`;
  } else if (resource === "players") {
    const url = `${envConfig.API_URL}/api/v1/players/steam/${id}`;
    return fetch(url)
      .then((response) => response.json())
      .then((player: SteamPlayer) => {
        return player?.nickname || id;
      })
      .catch(() => {
        return id;
      });
  }

  // Default - use ID as label
  return id;
};

const getActiveTabLabel = (tab: string | null): string | null => {
  if (!tab) return null;

  switch (tab) {
    case "main":
      return "Overview";
    case "skills":
      return "Skills";
    case "mapstats":
      return "Map Statistics";
    default:
      return tab.charAt(0).toUpperCase() + tab.slice(1);
  }
};

export const AutoBreadcrumbs = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { href: string; label: string }[]
  >([]);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);

    const buildBreadcrumbs = async () => {
      const crumbs: { href: string; label: string }[] = [];
      let hrefAccumulator = "";

      for (const [i, segment] of segments.entries()) {
        hrefAccumulator += `/${segment}`;

        if (i % 2 === 0) {
          // Resource type
          crumbs.push({
            href: hrefAccumulator,
            label: segment.charAt(0).toUpperCase() + segment.slice(1)
          });
        } else {
          // Resource ID – only if there is a valid resource name before it
          const resource = segments[i - 1];
          if (resource) {
            try {
              const label = await fetchLabelFor(resource, segment);
              crumbs.push({
                href: hrefAccumulator,
                label
              });
            } catch {
              crumbs.push({
                href: hrefAccumulator,
                label: segment
              });
            }
          }
        }
      }

      // Add the active tab as the last breadcrumb if it exists
      const activeTab = searchParams.get("tab");
      const tabLabel = getActiveTabLabel(activeTab);

      if (
        activeTab &&
        tabLabel &&
        (segments.includes("players") || segments.includes("teams"))
      ) {
        const tabPath = `${hrefAccumulator}?tab=${activeTab}`;
        crumbs.push({
          href: tabPath,
          label: tabLabel
        });
      }

      setBreadcrumbs(crumbs);
    };

    buildBreadcrumbs();
  }, [pathname, searchParams]);

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link className="text-xxs sm:text-xs" href="/">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-xxs sm:text-xs" href={crumb.href}>
                  {crumb.label}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
