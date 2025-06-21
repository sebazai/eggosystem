import { MatchHeader } from "@/components/matches/match/MatchHeader";
import type { MatchInfo } from "@eggosystem/types";
import type React from "react";
import { getMatchInfo } from "./utils";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { createPageMetadata } from "@/lib/metadata";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ match_id: string }>;
}

export async function generateMetadata({ params }: LayoutProps) {
  const { match_id } = await params;
  // parse the match_id to a number
  const matchIdNumber = parseInt(match_id, 10);
  if (isNaN(matchIdNumber)) {
    return {
      title: "Match not found"
    };
  }

  const result = await getMatchInfo<MatchInfo>(matchIdNumber);
  if (!result) {
    return {
      title: "Match not found"
    };
  }
  const team1 = Object.values(result.teams)[0];
  const team2 = Object.values(result.teams)[1];
  if (!team1 || !team2) {
    return {
      title: "Match not found"
    };
  }
  const date = new Date(result.match_date);
  const formattedDate = date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "2-digit"
    })
    .toUpperCase();

  return createPageMetadata({
    title: `Match ${team1.name} vs ${team2.name} - ${formattedDate}`
  });
}

export default async function Layout({ children, params }: LayoutProps) {
  const { match_id } = await params;
  const matchIdNumber = parseInt(match_id, 10);
  if (isNaN(matchIdNumber)) {
    return <ContentContainer>Match id not a number</ContentContainer>;
  }
  const matchInfo = await getMatchInfo<MatchInfo>(matchIdNumber);

  if (!matchInfo) {
    return <ContentContainer>Match not found</ContentContainer>;
  }
  const teams = Object.values(matchInfo.teams);
  if (teams.length < 2) {
    return (
      <ContentContainer>Not enough teams found for match</ContentContainer>
    );
  }

  return (
    <>
      <div className="px-4 pt-4">
        <AutoBreadcrumbs />
      </div>

      <MatchHeader
        team1={teams[0]!}
        team2={teams[1]!}
        matchDate={matchInfo.match_date}
        matchStartTime={matchInfo.start_time}
        matchEndTime={matchInfo.end_time}
        seasonName={matchInfo.season_name}
        leagueName={matchInfo.league_name}
        seasonId={matchInfo.season_id}
        leagueId={matchInfo.league_id}
      />
      <CardContainer classNames="rounded-none">
        <div className="p-2">{children}</div>
      </CardContainer>
    </>
  );
}
