import { ListRegisteredTeams } from "@/components/dashboard/registration/ListRegisteredTeams";
import { ListRegistrationDrafts } from "@/components/dashboard/registration/ListRegistrationDrafts";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Registered teams</h1>
      <ListRegisteredTeams />
      <h2 className="mt-10 mb-2 text-lg font-semibold">
        In-progress registrations
      </h2>
      <ListRegistrationDrafts />
    </WithRoleProtection>
  );
}
