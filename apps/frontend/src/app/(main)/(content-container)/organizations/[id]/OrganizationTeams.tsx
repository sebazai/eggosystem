import { envConfig } from "@/configs/env";
import type { Team } from "@eggosystem/types";
import TeamCard from "./TeamCard";
import { createTeamLogoUrl } from "@/lib/utils";

type OrganizationTeamsProps = {
  organizationId: string;
};

export default async function OrganizationTeams({
  organizationId
}: OrganizationTeamsProps) {
  const url = `${envConfig.API_URL}/api/v1/organizations/${organizationId}/teams`;
  const result = await fetch(url);
  const orgTeams: Team[] = await result.json();
  return (
    <>
      <h2>Teams</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgTeams.map((team) => (
          <TeamCard
            key={team.id}
            id={team.id}
            name={team.name}
            logoUrl={createTeamLogoUrl(team.team_logo)}
          />
        ))}
      </div>
    </>
  );
}
