import PlayerTabLayoutClient from "../PlayerTabLayoutClient";
import { PlayerHistoricalTab } from "@/components/players/PlayerHistoricalTab";

interface PlayerHistoricalProps {
  params: Promise<{
    steamId: string;
  }>;
}

export default async function PlayerHistoricalPage({
  params
}: PlayerHistoricalProps) {
  const { steamId } = await params;

  return (
    <PlayerTabLayoutClient steamId={steamId}>
      <PlayerHistoricalTab steamId={steamId} />
    </PlayerTabLayoutClient>
  );
}
