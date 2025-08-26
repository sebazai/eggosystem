"use client";

import { useAuth } from "@/context/AuthContext";
import { useSeasonCaptains } from "@/hooks/data/useSeasonCaptains";
import { hasCaptainsAccess, getUserHighestRole } from "@/lib/roleUtils";
import { CardContainer } from "../layout/CardContainer";
import { ContentContainer } from "../layout/ContentContainer";

export const CaptainsPage = ({
  seasonId,
  seasonName
}: {
  seasonId: string;
  seasonName: string;
}) => {
  const { user, loading } = useAuth();
  const { captains, isLoading, isValidating, isError } =
    useSeasonCaptains(seasonId);

  if (loading) {
    return (
      <ContentContainer>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-lg">Loading...</div>
        </div>
      </ContentContainer>
    );
  }

  // Check if user has access
  if (!hasCaptainsAccess(user)) {
    return (
      <ContentContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h1 className="text-3xl mb-4 text-red-600">Access Denied</h1>
          <p className="text-lg mb-4">
            You don&apos;t have permission to view this page.
          </p>
          <p className="text-gray-600">
            This page is restricted to users with admin, captain, or helpdesk
            roles.
          </p>
          {user && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                Your current roles: {user.roles.join(", ")}
              </p>
            </div>
          )}
        </div>
      </ContentContainer>
    );
  }

  if (isError) {
    return (
      <ContentContainer>
        <div className="text-center text-destructive text-lg mb-4">
          {isError.message}
        </div>
      </ContentContainer>
    );
  }

  if (isLoading || isValidating) {
    return (
      <ContentContainer>
        <div className="text-center text-lg">Loading team captains...</div>
      </ContentContainer>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl">Team Captains - {seasonName}</h1>
        {user && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
            Access granted as:{" "}
            <span className="font-semibold text-foreground">
              {getUserHighestRole(user)}
            </span>
          </div>
        )}
      </div>

      <CardContainer classNames="p-2 md:p-4">
        <div className="bg-card overflow-hidden">
          <div className="overflow-auto">
            <table className="text-sm sm:text-base w-full">
              <thead>
                <tr className="bg-kanaliiga-light-brown/30 uppercase text-kanaliiga-orange">
                  <th className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                    Team
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                    Captain
                  </th>
                  <th className="px-3 py-2 text-left whitespace-nowrap font-semibold">
                    Co-Captain
                  </th>
                </tr>
              </thead>
              <tbody>
                {captains?.map((captain) => (
                  <tr
                    key={captain.team_id}
                    className="border-b border-border h-10 transition-colors hover:bg-kanaliiga-light-brown/10"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-foreground">
                        {captain.team_name}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {captain.captain_discord ? (
                        <div className="text-foreground">
                          {captain.captain_discord}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">
                          Not set
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {captain.co_captain_discord ? (
                        <div className="text-foreground">
                          {captain.co_captain_discord}
                        </div>
                      ) : (
                        <div className="text-muted-foreground italic">
                          Not set
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContainer>
    </div>
  );
};
