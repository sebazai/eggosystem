"use client";

import { useAuth } from "@/context/AuthContext";
import { useFaceitLinks } from "@/hooks/data/useFaceitLinks";
import { Trophy, Users, ExternalLink, Target } from "lucide-react";

export const FaceitLinksPage = ({
  seasonId,
  seasonName
}: {
  seasonId: string;
  seasonName: string;
}) => {
  const { user: _user } = useAuth();
  const data = useFaceitLinks(seasonId);

  if (data.isLoading || data.isValidating) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
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

  return (
    <div className="mx-auto px-4 py-8">
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
              <div
                key={link.id}
                className="group bg-card border border-border rounded-xl p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-muted/30 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-foreground mb-2">
              About Faceit Integration
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Faceit is only used to schedule & play the matches . Statistics,
              standings etc are on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
