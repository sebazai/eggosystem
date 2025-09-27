import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["helpdesk"]}>
      <h1>Seasons</h1>
    </WithRoleProtection>
  );
}
