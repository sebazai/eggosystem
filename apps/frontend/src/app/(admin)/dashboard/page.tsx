import { KanaEloCalculateButton } from "@/components/dashboard/KanaEloCalculateButton";
import { FaceitSyncSection } from "./FaceitSyncSection";

export default async function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <h2 className="mb-4 text-lg font-semibold">FACEIT Integration</h2>
          <FaceitSyncSection />
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <h2 className="mb-4 text-lg font-semibold">KanaElo Calculation</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Calculate kana_elo for all players using CSRankker API and update
            SteamPlayerKanaElo table
          </p>
          <KanaEloCalculateButton />
        </div>
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  );
}
