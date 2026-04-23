import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SponsorsAdminClient } from "@/components/dashboard/sponsors/SponsorsAdminClient";

export default function SponsorsDashboardPage() {
  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Sponsors</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Manage marketing sponsors shown on the public site. Only admins can
          change these settings.
        </p>
        <SponsorsAdminClient />
      </div>
    </WithRoleProtection>
  );
}
