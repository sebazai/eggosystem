"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSteamPlayer } from "@/hooks/data/dashboard/useSteamPlayer";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerBadgeProps {
  steamId: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export const PlayerBadge = ({
  steamId,
  variant = "secondary",
  className
}: PlayerBadgeProps) => {
  const { player, isLoading, isError } = useSteamPlayer(steamId);

  if (isLoading) {
    return <Skeleton className="h-6 w-16" />;
  }

  if (isError || !player) {
    return (
      <Badge variant={variant} className={className}>
        {steamId}
      </Badge>
    );
  }

  return (
    <Link href={`/players/${steamId}`}>
      <Badge
        variant={variant}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      >
        {player.nickname || steamId}
      </Badge>
    </Link>
  );
};
