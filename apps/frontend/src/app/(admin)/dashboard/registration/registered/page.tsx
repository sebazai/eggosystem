import { ListRegisteredTeams } from "@/components/dashboard/registration/ListRegisteredTeams";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Registered teams</h1>
      <ListRegisteredTeams />
    </WithRoleProtection>
  );
}
