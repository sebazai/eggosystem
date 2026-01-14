import { ListRegisteredTeams } from "@/components/dashboard/registration/ListRegisteredTeams";
import { ListRegistrationDrafts } from "@/components/dashboard/registration/ListRegistrationDrafts";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex items-center justify-between mb-4">
        <h1>Registered teams</h1>
        <SelectedSeasonBadge />
      </div>
      <ListRegisteredTeams />
      <h2 className="mt-10 mb-2 text-lg font-semibold">
        In-progress registrations
      </h2>
      <ListRegistrationDrafts />
    </WithRoleProtection>
  );
}
