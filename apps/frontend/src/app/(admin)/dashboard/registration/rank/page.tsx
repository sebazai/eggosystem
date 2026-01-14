import { SeasonPlayerRankForm } from "@/components/dashboard/registration/SeasonPlayerRankForm";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex items-center justify-between mb-4">
        <h1>Manual rank insert</h1>
        <SelectedSeasonBadge />
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h2 className="font-semibold mb-2">How It Works</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Existing ranks are updated only if new values are provided and
              greater than 0
            </li>
            <li>Manual rank flags are set to track admin-added data</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">After Submission</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Tell the team captain to remove and re-add the player&apos;s Steam
              ID in their registration form
            </li>
            <li>
              This refreshes the rank data and shows the newly added values
            </li>
            <li>
              Ranks cannot be removed through this form - only updated with new
              values
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <h3 className="font-semibold text-yellow-800 mb-1">
            Important Notes
          </h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            <li>
              FaceIT ELO values are automatically converted to levels (100-2000+
              ELO = Level 1-10)
            </li>
            <li>All timestamps are set to current date/time when submitted</li>
            <li>
              Empty fields or zero values are ignored and won&apos;t overwrite
              existing data
            </li>
          </ul>
        </div>
      </div>

      <Separator className="my-5 bg-kanaliiga-orange" />
      <SeasonPlayerRankForm />
    </WithRoleProtection>
  );
}
