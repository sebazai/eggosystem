import { envConfig } from "@/configs/env";
import type { OrganizationTeamTrophies } from "@eggosystem/types";
import OrgTrophy from "./OrgTrophy";

type OrganizationTorphiesProps = {
  organizationId: string;
};

export default async function OrganizationTrophies({
  organizationId
}: OrganizationTorphiesProps) {
  const url = `${envConfig.API_URL}/api/v1/organizations/${organizationId}/trophies`;
  const result = await fetch(url);
  const orgTrophies: OrganizationTeamTrophies[] = await result.json();

  if (orgTrophies.length === 0) {
    return null;
  }
  return (
    <>
      <h2>Trophies</h2>
      <div className="flex flex-wrap gap-4 mt-6">
        {orgTrophies.map((trophy) => (
          <OrgTrophy
            key={`${trophy.season_name} ${trophy.league_name}`}
            team={trophy.team_name}
            placement={trophy.placement}
            season={trophy.season_name}
            league={trophy.league_name}
          />
        ))}
      </div>
    </>
  );
}
