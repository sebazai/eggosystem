import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createTeamLogoUrl } from "@/lib/utils";
import { NextImageFallback } from "../layout/image-with-fallback";

interface StatsGridRowProps {
  linkUrl: string;
  columnOneText: string;
  columnTwoText?: string;
  teamLogo?: string;
  teamName?: string;
  mapsPlayed: number;
  value: string;
  placement: string;
  unit?: string;
  playerIndex?: number;
}

export const StatsGridRow = ({
  linkUrl,
  columnOneText,
  columnTwoText,
  mapsPlayed,
  value,
  placement,
  unit,
  teamLogo,
  teamName,
  playerIndex
}: StatsGridRowProps) => {
  const searchParams = useSearchParams();
  const isTop3 = playerIndex !== undefined && playerIndex < 3;
  const isRest = playerIndex !== undefined && playerIndex >= 3;
  const isFirst = playerIndex === 0;
  const playerNameClass = isTop3
    ? `font-bold min-w-20${isFirst ? " text-base" : ""}`
    : isRest
      ? "italic text-foreground min-w-20"
      : "text-foreground min-w-20";
  const rowClass = isTop3
    ? `relative z-10 rounded shadow-md bg-black/30 flex justify-between py-3 px-1 ${isFirst ? "text-xl" : "text-sm"}`
    : "flex justify-between py-3 px-1 cursor-pointer text-sm";
  return (
    <Link
      href={{
        pathname: linkUrl,
        query: searchParams.toString()
      }}
      data-testid="stats-row"
      className={`${rowClass} mb-2 last:mb-0 hover:bg-white/10 transition-colors`}
    >
      <div className="flex items-center gap-5">
        <span
          className="w-6 text-center text-muted-foreground"
          data-testid="placement"
        >
          {placement}
        </span>
        {teamLogo && (
          <NextImageFallback
            src={createTeamLogoUrl(teamLogo)}
            alt={`${teamName} logo`}
            width={20}
            height={20}
            className="hidden rounded-full sm:block flex-shrink-0"
          />
        )}

        <div className="flex items-center gap-2">
          <span className={playerNameClass} data-testid="object-name">
            {columnOneText}
          </span>
          {columnTwoText && (
            <span className="hidden xs:block md:hidden text-muted-foreground text-sm min-w-15 break-all lg:block">
              {columnTwoText}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="hidden text-muted-foreground text-xs xxs:block min-w-10"
          data-testid="maps-played"
        >
          {mapsPlayed} maps
        </span>
        <span
          className={`w-16 items-center text-right font-bold`}
          data-testid="stats-grid-value"
        >
          {unit ? `${value}${unit}` : `${value}`}
        </span>
      </div>
    </Link>
  );
};
