import { ManualPlayerApprovalForm } from "@/components/dashboard/registration/manual-approval-form";
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
        Players who are manually approved must have successfully registered for
        Kanahub, accepted the privacy policy, and verified their personal email.
      </p>

      <Separator className="my-5 bg-kanaliiga-orange" />

      <h2>Instructions</h2>
      <p className="mb-5">
        Select either team or organization. If you need to create a new team or
        organization, select the &quot;Create new&quot; option.
        <br />
        Add all the players you want to approve by adding their Steam ID.
      </p>
      <ManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
