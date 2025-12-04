import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SeasonLeagueMapperClient } from "@/components/dashboard/season-league-mapper/SeasonLeagueMapperClient";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <SeasonLeagueMapperClient />
    </WithRoleProtection>
  );
}
