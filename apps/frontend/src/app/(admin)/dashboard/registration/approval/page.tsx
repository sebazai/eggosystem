import { TeamManualPlayerApprovalForm } from "@/components/dashboard/registration/manual-approval-form";
import { WithRoleProtection } from "@/components/dashboard/with-role-protection";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Manually Approved</h1>
      <p>
        Use this form to pre-approve players who, for example, do not have a
        valid work email but have been verified to be part of the organization
        or team through other means.
      </p>
      <p>
        If the captain requires approval, enter the Captain&apos;s Steam ID and
        add their Steam ID as an &quot;Accepted Player.&quot;
      </p>
      <p>
        Players who are manually approved must have successfully registered for
        Kanahub, accepted the privacy policy, and verified their personal email.
      </p>

      <Separator className="my-5 bg-kanaliiga-orange" />
      <TeamManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
