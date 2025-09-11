import {
  createPlatformTeamUrl,
  createNextUrl,
  createTeamLogoUrl
} from "@/lib/utils";
import { NextImageFallback } from "../layout/NextImageFallback";
import { TeamWinLossDetails } from "./TeamWinLossDetails";
import { useFilteredTeamById } from "@/hooks/data/filtered/useFilteredTeamById";
import { ContentContainer } from "../layout/ContentContainer";
import { useParams } from "next/navigation";
import { useFilters } from "@/context/FilterContext";
import Link from "next/link";
import Image from "next/image";

export const TeamsHeader = () => {
  const params = useParams();
  const teamId = Number(params.teamId);
  const { filterParams } = useFilters();
  const { team, isLoading, error } = useFilteredTeamById({
    teamId,
    filterQueryParams: filterParams
  });

  if (error) {
    return <ContentContainer>Error loading team details</ContentContainer>;
  }

  if (isLoading) {
    return <ContentContainer>Loading team details...</ContentContainer>;
  }

  if (!team) {
    return <ContentContainer>Team not found</ContentContainer>;
  }

  return (
    <div className="p-3 sm:p-6 bg-card border-b border-border rounded-md overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-4">
        <NextImageFallback
          src={createTeamLogoUrl(team.team_logo)}
          alt={team.name}
          width={80}
          height={80}
          className="rounded-full h-15 w-15 sm:h-25 sm:w-25"
        />
        <div>
          <div className="flex items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-kanaliiga-orange">
              {team.name}
            </h1>
            {team.external_team_id && (
              <Link
                href={createPlatformTeamUrl(team.external_team_id) || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={createNextUrl("/images/faceit/icon-pheasant.png")}
                  alt="Faceit"
                  width={25}
                  height={20}
                  className="w-[20px] h-[16px]"
                />
              </Link>
            )}
          </div>
          <div className="flex sm:flex-row flex-col sm:items-center gap-1 sm:gap-2 mt-1">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {team.latest_season_name}
            </span>
            <span className="hidden sm:block text-muted-foreground">•</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {team.latest_league_name}
            </span>
          </div>
        </div>
        <div className="ml-auto">
          <TeamWinLossDetails
            teamId={team.id}
            filterQueryParams={filterParams}
          />
        </div>
      </div>
    </div>
  );
};
