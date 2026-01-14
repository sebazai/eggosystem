import { ManualPlayerApprovalForm } from "@/components/dashboard/registration/ManualPlayerApprovalForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex items-center justify-between mb-4">
        <h1>Manually Approved</h1>
        <SelectedSeasonBadge />
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h2 className="font-semibold mb-2">What Does This Form Do?</h2>
          <p>
            This form allows you to pre-approve players who don&apos;t have
            valid work emails but have been verified to be part of an
            organization or team through other means (e.g., Discord ticket
            verification).
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">
            What Information Do I Need to Provide?
          </h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>
              <strong>Either</strong> an existing organization{" "}
              <strong>OR</strong> an existing team (you cannot select both)
            </li>
            <li>
              At least one player&apos;s Steam ID (17-digit format, e.g.,
              76561198012345678)
            </li>
            <li>
              If creating a new organization: name, business ID (y-tunnus), and
              website are all required
            </li>
            <li>If creating a new team: team name is required</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">How Does the Approval Work?</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>
              Each player is added to the SeasonPlayerApprovals table for the
              selected season (or the current active CS2 season if no season is
              selected)
            </li>
            <li>
              Players are linked to either an organization OR a team (never
              both)
            </li>
            <li>The approval records who approved the players and when</li>
            <li>
              Approved players can register without work email verification
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Optional Fields</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>
              <strong>Ticket Number:</strong> Reference number for the support
              ticket or issue
            </li>
            <li>
              <strong>Details:</strong> Any additional notes about the approval
              (do not include sensitive information)
            </li>
          </ul>
        </div>

        <div className="bg-muted border border-border rounded p-3">
          <h3 className="font-semibold mb-1 text-foreground">
            Important Reminders
          </h3>
          <ul className="list-disc list-inside space-y-1 text-foreground pl-4">
            <li>
              <strong>Organization vs. Team:</strong> You must choose either an
              organization OR a team, not both
            </li>
            <li>
              <strong>Organization-level approval is recommended</strong>{" "}
              because it gives players flexibility to join any team within the
              organization
            </li>
            <li>
              <strong>Team-level approval</strong> restricts players to that
              specific team only
            </li>
            <li>
              <strong>New organizations</strong> require a business ID
              (y-tunnus) and website
            </li>
            <li>
              <strong>Steam IDs</strong> must be in the 17-digit SteamID64
              format (e.g., 76561198012345678)
            </li>
            <li>
              <strong>Remember to communicate:</strong> After creating new
              organizations or teams, make sure to inform the relevant people
              about the next steps in the signup form
            </li>
          </ul>
        </div>
      </div>

      <Separator className="my-5 bg-kanaliiga-orange" />
      <ManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
