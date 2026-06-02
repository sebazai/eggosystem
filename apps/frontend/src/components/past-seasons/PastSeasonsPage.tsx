"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { CardSkeleton } from "@/components/loading";
import {
  formatSeasonDisplayLabel,
  getPastCs2Seasons,
  getSeasonPageLinks,
  type SeasonPageLink
} from "@/lib/season-utils";
import { createNextUrl } from "@/lib/utils";

function SeasonLinkButton({ link }: { link: SeasonPageLink }) {
  const className =
    "rounded-md border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 flex items-center justify-between gap-2";

  if (link.isExternal) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <span>{link.title}</span>
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link href={createNextUrl(link.href)} className={className}>
      <span>{link.title}</span>
    </Link>
  );
}

export function PastSeasonsPage() {
  const { seasons, isLoading, isError } = useAllSeasons();
  const pastSeasons = seasons ? getPastCs2Seasons(seasons) : [];

  if (isError) {
    return <ContentContainer>Failed to load past seasons.</ContentContainer>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2 flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-kanaliiga-orange" />
          Past Seasons
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse standings, calendars, playoffs, and fantasy leagues from
          previous CS:GO and CS2 seasons.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton showHeader={true} contentLines={4} />
          <CardSkeleton showHeader={true} contentLines={4} />
        </div>
      ) : pastSeasons.length === 0 ? (
        <ContentContainer classNames="min-h-[30vh]">
          No past seasons available yet.
        </ContentContainer>
      ) : (
        <div className="space-y-4">
          {pastSeasons.map((season) => (
            <CardContainer key={season.id} classNames="p-4 md:p-6">
              <h2 className="text-xl mb-4">
                {formatSeasonDisplayLabel(season.full_name)}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {getSeasonPageLinks(season.id).map((link) => (
                  <SeasonLinkButton key={link.href} link={link} />
                ))}
                <Link
                  href={createNextUrl(`/season-results?season=${season.id}`)}
                  className="rounded-md border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  Season Results
                </Link>
              </div>
            </CardContainer>
          ))}
        </div>
      )}
    </div>
  );
}
