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
        If you add the player on organization level, then the player can be
        added to any team in the organization. If you decide to add the player
        on team level, the player is only approved for that specific team.
      </p>

      <Separator className="my-5 bg-kanaliiga-orange" />

      <h2>Instructions you should follow</h2>
      <p className="mb-5">
        Select either team OR organization, you do not need to select both. If
        you need to create a new team OR organization, select the &quot;Create
        new&quot; option.
        <br />
        Add all the players you want to approve by adding their Steam IDs. You
        can add multiple SteamIDs for the same org/team.
        <br />
        NB! This form should not be used to create organizations for teams that
        do not have an organization. So if there is an old team that gets a
        player approved, they can create the organization themselves during the
        signup process.
      </p>
      <ManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
