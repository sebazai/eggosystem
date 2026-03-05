import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { PlayoffSeedsClient } from "@/components/dashboard/playoff-seeds/PlayoffSeedsClient";

export default function PlayoffSeedsPage() {
  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <PlayoffSeedsClient />
    </WithRoleProtection>
  );
}
