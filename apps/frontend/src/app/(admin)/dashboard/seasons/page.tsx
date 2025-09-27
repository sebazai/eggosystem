import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SeasonsPageClient } from "@/components/dashboard/seasons/SeasonsPageClient";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["helpdesk", "admin"]}>
      <div className="mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Seasons Management</h1>
        <SeasonsPageClient />
      </div>
    </WithRoleProtection>
  );
}
