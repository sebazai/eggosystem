import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SeasonForm } from "@/components/dashboard/seasons/SeasonForm";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["helpdesk", "admin"]}>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Seasons Management</h1>
        <SeasonForm />
      </div>
    </WithRoleProtection>
  );
}
