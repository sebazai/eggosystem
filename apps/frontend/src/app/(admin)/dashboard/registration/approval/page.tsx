import { ManualPlayerApprovalForm } from "@/components/dashboard/registration/ManualPlayerApprovalForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Manually Approved</h1>

      <div className="space-y-4 text-sm">
        <div>
          <h2 className="font-semibold mb-2">Purpose</h2>
          <p>
            Use this form to pre-approve players who don&apos;t have valid work
            emails but have been verified to be part of the organization or team
            through other means.
          </p>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Required Fields</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Organization OR Team:</strong> You must select either an
              organization or a team (not both)
            </li>
            <li>
              <strong>Steam IDs:</strong> At least one player Steam ID (17
              digits, e.g., 76561198012345678)
            </li>
            <li>
              <strong>New Organization Fields:</strong> If creating new
              organization - name, business ID, and website are required
            </li>
            <li>
              <strong>New Team Name:</strong> If creating new team - team name
              is required
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Approval Scenarios</h2>

          <div className="space-y-3">
            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold text-blue-800 mb-1">
                1. Existing Organization (Recommended)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Select existing organization from dropdown</li>
                <li>Leave team selection empty</li>
                <li>Add player Steam IDs</li>
                <li>Players are approved for any team in that organization</li>
                <li>
                  Team captains can then add these players to their specific
                  teams
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold text-green-800 mb-1">
                2. Existing Team (Not linked to any organization)
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Select existing team from dropdown</li>
                <li>Add player Steam IDs</li>
                <li>Players are approved for that specific team only</li>
                <li>
                  Use this when you know the exact team the player will join or
                  when the team is not yet linked to any organization.
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold text-purple-800 mb-1">
                3. New Organization
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Select &quot;Create New Organization&quot;</li>
                <li>
                  Fill in organization name, business ID, and website (all
                  required)
                </li>
                <li>Leave team selection empty</li>
                <li>Add player Steam IDs</li>
                <li>New organization is created</li>
                <li>Players are approved for any team in that organization</li>
                <li>
                  Team captains can create teams under this organization during
                  signup, please inform them that they need to select this
                  organization from the dropdown menu in the signup form
                  organization tab.
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h3 className="font-semibold text-orange-800 mb-1">
                4. New Team Under Existing Organization
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Select existing organization from dropdown</li>
                <li>Add player Steam IDs</li>
                <li>New team is created under existing organization</li>
                <li>
                  Players are approved for the organization, they can join any
                  team in the organization
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">How It Works</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Creates entries in SeasonPlayerApprovals table for each player
            </li>
            <li>
              Links players to either organization_id OR team_id (never both)
            </li>
            <li>Records who approved the players and when</li>
            <li>
              Players can then register normally without work email validation
            </li>
            <li>Approval is tied to the current active CS2 season</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Optional Fields</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Ticket Number:</strong> Reference to support ticket or
              issue
            </li>
            <li>
              <strong>Details:</strong> Additional notes about the approval,
              please do not add any sensitive data here.
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h3 className="font-semibold text-yellow-800 mb-1">
            Important Notes
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            <li>You must select either organization OR team - not both</li>
            <li>
              Organization-level approval is recommended as it gives more
              flexibility
            </li>
            <li>
              Organization-level approval allows players to join any team in
              that organization
            </li>
            <li>
              Team-level approval restricts players to that specific team only
            </li>
            <li>
              New organizations require business ID (y-tunnus) and website
            </li>
            <li>All Steam IDs must be exactly 17 digits</li>
          </ul>
        </div>
      </div>

      <Separator className="my-5 bg-kanaliiga-orange" />
      <ManualPlayerApprovalForm />
    </WithRoleProtection>
  );
}
