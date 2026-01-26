import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import { createNextUrl, mapToReadableName } from "@/lib/utils";
import { SeasonPlatform } from "@eggosystem/types";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchMapsHeaderProps {
  matchId: number;
  matchGameId?: number;
  platform: SeasonPlatform;
  externalMatchRoomUrl: string | null;
  handleMapSelect: (matchId: number, matchGameId?: number | undefined) => void;
}

const platformIcon = (platform: SeasonPlatform) => {
  if (platform === SeasonPlatform.FACEIT) {
    return (
      <Image
        src={createNextUrl("/images/faceit/icon-pheasant.png")}
        alt="Faceit"
        width={25}
        height={20}
        className="w-[13px] h-[10px] sm:w-[20px] sm:h-[16px] mx-2"
      />
    );
  }
  return null;
};

export const MatchMapsHeader = ({
  matchId,
  matchGameId,
  platform,
  externalMatchRoomUrl,
  handleMapSelect
}: MatchMapsHeaderProps) => {
  const { maps, isLoading } = useMatchMaps(matchId);

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="flex flex-row gap-2 mb-5 sm:mb-0">
          <Skeleton className="h-7 w-32" />
          {externalMatchRoomUrl && <Skeleton className="h-5 w-20" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="flex flex-row gap-2 mb-5 sm:mb-0">
          <h1>MATCH STATS</h1>
          {externalMatchRoomUrl && (
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={externalMatchRoomUrl}
              className="justify-center items-center flex flex-row text-xs text-muted-foreground hover:text-kanaliiga-light-brown transition-colors"
            >
              {platformIcon(platform)}
              <button className="text-xs cursor-pointer">
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            </Link>
          )}
        </div>
        {maps?.length !== 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 ${!matchGameId ? "bg-foreground text-background" : "text-muted-foreground"} rounded text-xs transition-transform hover:scale-105 hover:text-kanaliiga-orange hover:cursor-pointer`}
              onClick={() => handleMapSelect(matchId)}
            >
              ALL MAPS
            </button>

            {maps?.map((map) => (
              <button
                key={map.id}
                className={`px-3 py-1 ${matchGameId === map.id ? "bg-foreground text-background" : "text-muted-foreground"} rounded text-xs transition-transform hover:scale-105 hover:text-kanaliiga-orange hover:cursor-pointer`}
                onClick={() => handleMapSelect(matchId, map.id)}
              >
                {mapToReadableName(map.map_name)}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
