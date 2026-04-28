import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { MapVetoAdminPanel } from "@/components/dashboard/matches/MapVetoAdminPanel";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Map veto</h1>
          <p className="text-muted-foreground">
            Select an unfinished match for the current season, review the active
            map pool, then enter or clear BO veto sequences using dashboard
            APIs.
          </p>
        </div>
        <MapVetoAdminPanel />
      </div>
    </WithRoleProtection>
  );
}
