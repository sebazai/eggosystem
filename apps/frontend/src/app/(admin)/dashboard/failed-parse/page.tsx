import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { FailedParseTable } from "@/components/dashboard/failed-parse/FailedParseTable";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parse Failed</h1>
          <p className="text-muted-foreground">
            Review and requeue demo parsing messages that have failed
            processing. Select messages and click &ldquo;Requeue for
            Parse&rdquo; to retry parsing.
          </p>
        </div>
        <FailedParseTable />
      </div>
    </WithRoleProtection>
  );
}
