import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { ManualDemoParseForm } from "@/components/dashboard/manual-demo-parse/ManualDemoParseForm";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Manual demo parse
          </h1>
          <p className="text-muted-foreground">
            Queue a demo download URL for parsing when automated feeds did not
            run or a repair is needed.
          </p>
        </div>
        <ManualDemoParseForm />
      </div>
    </WithRoleProtection>
  );
}
