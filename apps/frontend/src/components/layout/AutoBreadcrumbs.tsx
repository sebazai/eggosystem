"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import type {
  Map,
  Match,
  MatchGame,
  Stage,
  SteamPlayer
} from "@eggosystem/types";
import { envConfig } from "@/configs/env";

const matchBreadcrumbLabel = (bestOf: number, stage: string) => {
  return `BO${bestOf} - ${stage}`;
};

// Simulate fetching a label for an ID
async function fetchLabelFor(resource: string, id: string): Promise<string> {
  switch (resource) {
    case "players": {
      const response = await fetch(
        `${envConfig.API_URL}/api/v1/${resource}/${id}`
      );
      const data: Pick<SteamPlayer, "nickname" | "steam_id"> =
        await response.json();
      return data.nickname || `${resource.slice(0, -1)} ${id}`;
    }
    case "matches": {
      const response = await fetch(
        `${envConfig.API_URL}/api/v1/${resource}/${id}/breadcrumb`
      );

      const data: Match & Stage = await response.json();
      return (
        matchBreadcrumbLabel(data.best_of, data.name) ||
        `${resource.slice(0, -1)} ${id}`
      );
    }
    case "games": {
      const response = await fetch(
        `${envConfig.API_URL}/api/v1/${resource}/${id}`
      );
      const data: {
        map_order: MatchGame["map_order"];
        map_id: MatchGame["map_id"];
        name: Map["name"];
      } = await response.json();
      return data.name || `${resource.slice(0, -1)} ${id}`;
    }
    case "teams": {
      const response = await fetch(
        `${envConfig.API_URL}/api/v1/${resource}/${id}`
      );
      const data: { name: string } = await response.json();
      return data.name || `${resource.slice(0, -1)} ${id}`;
    }
    case "seasons": {
      const response = await fetch(
        `${envConfig.API_URL}/api/v1/${resource}/${id}`
      );
      const data: { name: string } = await response.json();
      return data.name || `${resource.slice(0, -1)} ${id}`;
    }
    default:
      return id;
  }
}

export const AutoBreadcrumbs = () => {
  const pathname = usePathname();
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
            // Handle special case for /matches/upcoming/{match_id}
            if (resource === "matches" && segment === "upcoming") {
              crumbs.push({
                href: hrefAccumulator,
                label: "Upcoming"
              });
            } else if (
              segments[i - 2] === "upcoming" &&
              segments[i - 3] === "matches"
            ) {
              // This is the match_id in /matches/upcoming/{match_id}
              const label = await fetchLabelFor("matches", segment).catch(
                () => segment
              );
              crumbs.push({
                href: hrefAccumulator,
                label
              });
            } else {
              const label = await fetchLabelFor(resource, segment).catch(
                () => segment
              );
              crumbs.push({
                href: hrefAccumulator,
                label
              });
            }
          }
        }
      }

      setBreadcrumbs(crumbs);
    };

    buildBreadcrumbs();
  }, [pathname]);

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
