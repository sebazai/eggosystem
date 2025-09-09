"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ExternalMatchIdBadgeProps {
  externalMatchId: string;
  className?: string;
}

export const ExternalMatchIdBadge = ({
  externalMatchId,
  className
}: ExternalMatchIdBadgeProps) => {
  const faceitUrl = `https://www.faceit.com/en/cs2/room/${externalMatchId}`;

  return (
    <a
      href={faceitUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <Badge
        variant="outline"
        className={`cursor-pointer hover:bg-muted transition-colors group ${className}`}
      >
        <span className="font-mono text-sm">{externalMatchId}</span>
        <ExternalLink className="ml-1 h-3 w-3 group-hover:text-primary transition-colors" />
      </Badge>
    </a>
  );
};
