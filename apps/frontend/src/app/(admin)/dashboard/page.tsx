import { KanaEloCalculateButton } from "@/components/dashboard/KanaEloCalculateButton";
import { GrandFinalPlacementsReplaySection } from "@/components/dashboard/GrandFinalPlacementsReplaySection";
import { FaceitSyncSection } from "./FaceitSyncSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/kanaliiga";

export default async function Page() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatCard value="—" label="Active Seasons" />
        <StatCard value="—" label="Registered Teams" />
        <StatCard value="—" label="Total Players" />
        <StatCard value="—" label="Pending Applications" />
      </div>

      {/* Tool panels */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">FACEIT Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <FaceitSyncSection />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">KanaElo Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Calculate kana_elo for all players using CSRankker API and update
              SteamPlayerKanaElo table
            </p>
            <KanaEloCalculateButton />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Grand Final Placements</CardTitle>
          </CardHeader>
          <CardContent>
            <GrandFinalPlacementsReplaySection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
