"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useTeam } from "@/hooks/data/dashboard/useTeam";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamBadgeProps {
  teamId: number;
  className?: string;
}

export const TeamBadge = ({ teamId, className }: TeamBadgeProps) => {
  const { team, isLoading, isError } = useTeam(teamId.toString());

  if (isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (isError || !team) {
    return (
      <Badge variant="secondary" className={className}>
        Team {teamId}
      </Badge>
    );
  }

  return (
    <Link href={`/dashboard/teams/${teamId}`}>
      <Badge
        variant="secondary"
        className={`cursor-pointer hover:bg-secondary/80 transition-colors ${className}`}
      >
        {team.name || `Team ${teamId}`}
      </Badge>
    </Link>
  );
};
