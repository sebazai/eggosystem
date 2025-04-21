import { MatchHeader } from "@/components/matches/match/match-header";
import type { MatchInfo } from "@eggosystem/types";
import type { Metadata } from "next";
import type React from "react";
import { getMatchInfo } from "./utils";
import { MatchBreadcrumbsWrapper } from "@/components/layout/breadcrumbs-wrapper";
import { CardContainer } from "@/components/layout/card-container";
import { ContentContainer } from "@/components/layout/content-container";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ match_id: string }>;
}

export async function generateMetadata({
  params
}: LayoutProps): Promise<Metadata> {
  const { match_id } = await params;

  const result = await getMatchInfo<MatchInfo>(match_id);
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
      day: "numeric",
      month: "short"
    })
    .toUpperCase();
  return {
    title: `Match ${team1.name} vs ${team2.name} - ${formattedDate}`
  };
}

export default async function Layout({ children, params }: LayoutProps) {
  const { match_id } = await params;
  const matchInfo = await getMatchInfo<MatchInfo>(match_id);

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
    <CardContainer>
      <div className="px-4 pt-4">
        <MatchBreadcrumbsWrapper />
      </div>

      <MatchHeader
        team1={teams[0]!}
        team2={teams[1]!}
        matchDate={matchInfo.match_date}
        matchStartTime={matchInfo.start_time}
        matchEndTime={matchInfo.end_time}
      />
      <div className="p-2 md:p-6">{children}</div>
    </CardContainer>
  );
}
