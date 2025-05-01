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
import type { Map, Match, MatchGame, SteamPlayer } from "@eggosystem/types";
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
        `${envConfig.API_URL}/api/v1/${resource}/${id}`
      );
      const data: Match = await response.json();
      return (
        matchBreadcrumbLabel(data.best_of, data.stage) ||
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

      setBreadcrumbs(crumbs);
    };

    buildBreadcrumbs();
  }, [pathname]);

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link className="text-xs" href="/">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-xs" href={crumb.href}>
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
