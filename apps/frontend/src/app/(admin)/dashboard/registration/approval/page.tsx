import { TeamManualPlayerApprovalForm } from "@/components/dashboard/registration/TeamManualPlayerApprovalForm";
import { WithRoleProtection } from "@/components/dashboard/with-role-protection";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <TeamManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
