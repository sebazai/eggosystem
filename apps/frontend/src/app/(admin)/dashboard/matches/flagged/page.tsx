import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { FlaggedMatchesTable } from "@/components/dashboard/matches/FlaggedMatchesTable";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flagged Matches</h1>
          <p className="text-muted-foreground">
            Review matches that have been flagged for suspicious activity or
            irregularities.
          </p>
        </div>
        <FlaggedMatchesTable />
      </div>
    </WithRoleProtection>
  );
}
