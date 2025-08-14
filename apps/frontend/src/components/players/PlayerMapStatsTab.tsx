import { PlayerMapStatsCards } from "./PlayerMapStatsCards";

interface PlayerMapStatsTabProps {
  steamId: string;
}

export const PlayerMapStatsTab = ({ steamId }: PlayerMapStatsTabProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Map Performance</h2>

      {/* Map Stats Cards */}
      <PlayerMapStatsCards steamId={steamId} />
    </div>
  );
};
