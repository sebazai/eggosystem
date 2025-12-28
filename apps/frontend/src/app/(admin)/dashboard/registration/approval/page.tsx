import { ManualPlayerApprovalForm } from "@/components/dashboard/registration/ManualPlayerApprovalForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Manually Approved</h1>

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
          <h2 className="font-semibold mb-2">Common Scenarios</h2>

          <div className="space-y-3">
            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold mb-1">
                Scenario 1: Approve Players for an Existing Organization
                (Recommended)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Select an existing organization from the dropdown</li>
                <li>Leave the team field empty</li>
                <li>Add the player Steam IDs</li>
                <li>
                  <strong>Result:</strong> Players can join any team within that
                  organization
                </li>
                <li>
                  <strong>Next steps:</strong> Team captains can add these
                  players to their teams during the signup process
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold mb-1">
                Scenario 2: Approve Players for a Specific Team
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Select an existing team from the dropdown</li>
                <li>Add the player Steam IDs</li>
                <li>
                  <strong>Result:</strong> Players can only join that specific
                  team
                </li>
                <li>
                  <strong>When to use:</strong> Use this when the team is not
                  linked to any organization, or when you want to restrict
                  players to one specific team
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold mb-1">
                Scenario 3: Create a New Organization and Approve Players
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Select &quot;Create New Organization&quot;</li>
                <li>
                  Fill in the organization name, business ID (y-tunnus), and
                  website
                </li>
                <li>Leave the team field empty</li>
                <li>Add the player Steam IDs</li>
                <li>
                  <strong>Result:</strong> A new organization is created, and
                  players are approved for any team within it
                </li>
                <li>
                  <strong className="text-kanaliiga-orange">
                    Important next step:
                  </strong>{" "}
                  Instruct team captains to go to the signup form, select the
                  newly created organization from the dropdown in the
                  Organization tab, click &quot;Create organization & continue
                  to team&quot;, then fill in their team details
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold mb-1">
                Scenario 4: Create a New Team Under an Existing Organization
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Select an existing organization from the dropdown</li>
                <li>Add the player Steam IDs</li>
                <li>
                  <strong>Result:</strong> Players are approved for the
                  organization (they can join any team within it)
                </li>
                <li>
                  <strong className="text-kanaliiga-orange">
                    Important next step:
                  </strong>{" "}
                  Instruct the team captain to go to the signup form, select the
                  organization, click &quot;Continue to team selection&quot;,
                  then select &quot;Add new...&quot; to create their team
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold mb-1">
                Scenario 5: Create Both a New Organization and a New Team
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                <li>Select &quot;Create New Organization&quot;</li>
                <li>
                  Fill in the organization name, business ID (y-tunnus), and
                  website
                </li>
                <li>Add the player Steam IDs</li>
                <li>
                  <strong>Result:</strong> A new organization is created, and
                  players are approved for the organization
                </li>
                <li>
                  <strong className="text-kanaliiga-orange">
                    Important next step:
                  </strong>{" "}
                  Instruct the team captain to: 1) Go to the signup form, 2)
                  Select the newly created organization from the Organization
                  tab, 3) Click &quot;Create organization & continue to
                  team&quot;, 4) In the Team tab, select &quot;Add new...&quot;
                  to create their team
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">How Does the Approval Work?</h2>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>
              Each player is added to the SeasonPlayerApprovals table for the
              current active CS2 season
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
