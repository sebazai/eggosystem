import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { TeamGameScoresEditor } from "@/components/dashboard/matches/TeamGameScoresEditor";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit map scores</h1>
          <p className="text-muted-foreground">
            View and update both teams’ map scores for a match game.
          </p>
        </div>
        <TeamGameScoresEditor />
      </div>
    </WithRoleProtection>
  );
}
