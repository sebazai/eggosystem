import { ListRegisteredTeams } from "@/components/dashboard/registration/list-registered-teams";
import { WithRoleProtection } from "@/components/dashboard/with-role-protection";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Registered teams</h1>
      <ListRegisteredTeams />
    </WithRoleProtection>
  );
}
