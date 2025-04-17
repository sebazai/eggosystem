"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PageBreadcrumbs = ({
  items,
  className = "mb-6"
}: PageBreadcrumbsProps) => {
  return (
    <div className={className}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.isCurrent ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || "#"}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export function useMatchBreadcrumbs() {
  const params = useParams();
  const matchId = params?.match_id as string;
  const gameId = params?.game_id as string;

  const items: BreadcrumbItem[] = [{ label: "Matches", href: "/matches" }];

  if (matchId) {
    items.push({
      label: "Match Details",
      href: gameId ? `/matches/${matchId}` : undefined,
      isCurrent: !gameId
    });
  }

  if (gameId) {
    items.push({
      label: "Game Details",
      isCurrent: true
    });
  }

  return items;
}

export function usePlayerBreadcrumbs(playerName?: string) {
  const params = useParams();
  const playerId = params?.playerId as string;

  const items: BreadcrumbItem[] = [{ label: "Players", href: "/players" }];

  if (playerId) {
    items.push({
      label: playerName || playerId,
      isCurrent: true
    });
  }

  return items;
}
