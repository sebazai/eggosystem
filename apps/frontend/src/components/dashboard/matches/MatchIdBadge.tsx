"use client";

import { Badge } from "@/components/ui/badge";
import { createNextUrl } from "@/lib/utils";
import Link from "next/link";

interface MatchIdBadgeProps {
  matchId: number;
  className?: string;
}

export const MatchIdBadge = ({ matchId, className }: MatchIdBadgeProps) => {
  return (
    <Link href={createNextUrl(`/matches/${matchId}`)} target="_blank">
      <Badge
        variant="secondary"
        className={`cursor-pointer hover:bg-secondary/80 transition-colors ${className}`}
      >
        {matchId}
      </Badge>
    </Link>
  );
};
