"use client";

import { useAuth } from "@/context/AuthContext";
import { useFaceitChampionshipTeamsValidations } from "@/hooks/data/useFaceitChampionshipTeamsValidations";
import { useFaceitLinks } from "@/hooks/data/useFaceitLinks";
import { createPlatformTeamUrl } from "@/lib/utils";
import {
  Trophy,
  Users,
  ExternalLink,
  Target,
  CheckCircle,
  XCircle,
  Users2
} from "lucide-react";
import { SteamLoginButton } from "../profile/SteamLoginButton";

interface FaceitLinkCardProps {
  link: {
    id: number;
    league_name: string;
    external_league_name?: string;
    type: string;
    sort_priority: number;
    faceit_url: string;
    external_id: string;
  };
}

const FaceitLinkCard = ({ link }: FaceitLinkCardProps) => {
  const { championshipTeams, isLoading, isError, isValidating } =
    useFaceitChampionshipTeamsValidations(link.external_id);

  const getLeagueIcon = (leagueName: string) => {
    if (
      leagueName.toLowerCase().includes("masters") ||
      leagueName.toLowerCase().includes("pro")
    ) {
      return <Trophy className="h-6 w-6 text-amber-600" />;
    }
    if (
      leagueName.toLowerCase().includes("challengers") ||
      leagueName.toLowerCase().includes("semi-pro")
    ) {
      return <Trophy className="h-6 w-6 text-slate-500" />;
    }
    return <Users className="h-6 w-6 text-slate-500" />;
  };

  const getLeagueBadgeColor = (sortPriority: number) => {
    if (sortPriority <= 2)
      return "bg-amber-100 text-amber-800 border border-amber-200";
    if (sortPriority <= 4)
      return "bg-slate-100 text-slate-800 border border-slate-200";
    if (sortPriority <= 6)
      return "bg-blue-50 text-blue-800 border border-blue-100";
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const getValidationIcon = (isValid: boolean) => {
    if (isValid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getValidationText = (isValid: boolean) => {
    if (isValid) {
      return "Valid";
    }
    return "Invalid";
  };

  const getValidationBadgeColor = (isValid: boolean) => {
    if (isValid) {
      return "bg-green-100 text-green-700 border border-green-200";
    }
    return "bg-red-100 text-red-700 border border-red-200";
  };

  const isChampionshipReady = () => {
    if (!championshipTeams || isLoading || isError) return false;

    const teams = Object.values(championshipTeams.teams);
    const totalTeams = teams.length;
    const validTeams = teams.filter((team) => team.isValid).length;
    const maxSlots = championshipTeams.maximumSlots;

    return totalTeams === maxSlots && validTeams === totalTeams;
  };

  const getCardBorderClass = () => {
    if (isChampionshipReady()) {
      return "border-green-500 hover:border-green-600 border-2";
    }
    return "border-border hover:border-primary/50";
  };

  return (
    <div
      className={`group bg-card border rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${getCardBorderClass()}`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="p-3 bg-slate-100 rounded-full">
            {getLeagueIcon(link.league_name)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-xl">
              {link.external_league_name || link.league_name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {link.type
                .replace(/([A-Z])/g, " $1")
                .trim()
                .toLocaleUpperCase()}
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${getLeagueBadgeColor(link.sort_priority)}`}
        >
          Tier {link.sort_priority}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t border-slate-100 pt-4">
          <span>League:</span>
          <span className="font-medium text-foreground">
            {link.league_name}
          </span>
        </div>

        {/* Teams Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Users2 className="h-4 w-4" />
            <span>Registered Teams</span>
            {isLoading || isValidating ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-400"></div>
            ) : championshipTeams ? (
              <span className="text-muted-foreground">
                {Object.keys(championshipTeams.teams).length}{" "}
                {championshipTeams.maximumSlots
                  ? `/ ${championshipTeams.maximumSlots}`
                  : ""}
              </span>
            ) : null}
          </div>

          {isLoading || isValidating ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground">Loading teams...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-4">
              <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-600">Failed to load teams</p>
            </div>
          ) : championshipTeams &&
            Object.keys(championshipTeams.teams).length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.entries(championshipTeams.teams).map(([teamId, team]) => (
                <div
                  key={teamId}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getValidationIcon(team.isValid)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {team.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {team.external_team_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getValidationBadgeColor(team.isValid)}`}
                    >
                      {getValidationText(team.isValid)}
                    </span>
                    <a
                      href={createPlatformTeamUrl(team.external_team_id) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
                      title="View team on Faceit"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Users2 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No teams registered
              </p>
            </div>
          )}

          {/* Championship Status Indicator */}
          {isChampionshipReady() && (
            <div className="flex items-center gap-2 p-3 bg-orange-500/20 dark:bg-orange-500/30 border border-orange-300 dark:border-orange-600 rounded-lg">
              <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Championship Ready - All teams registered and valid
              </span>
            </div>
          )}
        </div>

        <a
          href={link.faceit_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-800 border border-slate-300 px-5 py-3 rounded-lg font-medium hover:bg-slate-300 transition-all duration-200"
        >
          <ExternalLink className="h-5 w-5" />
          Open on Faceit
        </a>
      </div>
    </div>
  );
};

export const FaceitLinksPage = ({
  seasonId,
  seasonName
}: {
  seasonId: string;
  seasonName: string;
}) => {
  const { user } = useAuth();
  const data = useFaceitLinks(seasonId);

  if (data.isLoading || data.isValidating) {
    return (
      <div className="mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Faceit links...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.isError) {
    return (
      <div className="mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="border border-red-100 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-4">
              Error Loading Links
            </h1>
            <p className="text-red-600 text-lg">{data.isError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border rounded-lg p-8 text-center items-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Links</h1>
            <p className=" text-lg">You must be logged in to view this page.</p>
            <div className="flex justify-center">
              <SteamLoginButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Faceit Division Links
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Access your division&apos;s Faceit championship page.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full border border-slate-200">
          <Trophy className="h-4 w-4" />
          <span className="font-medium">{seasonName}</span>
        </div>
      </div>

      {/* Links Grid */}
      {data.faceitLinks?.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <Target className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Faceit Links Available
          </h2>
          <p className="text-muted-foreground">
            There are currently no Faceit division links available for this
            season.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.faceitLinks?.map((link) => (
            <FaceitLinkCard key={link.id} link={link} />
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center">
        <div className="bg-muted/30 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-foreground mb-2">
            About Faceit Integration
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-3">
            Faceit is only used to schedule & play the matches . Statistics,
            standings etc are on this page.
          </p>
          <div className="border-t border-border pt-3">
            <p className="text-muted-foreground text-xs">
              <strong>Note:</strong> Team validation only confirms registration
              status and data completeness. This does not validate that teams
              are in the correct group (i.e. Group A or Group B).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
