import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn, createTeamLogoUrl } from "@/lib/utils";
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
  const isFirst = playerIndex === 0;

  return (
    <Link
      href={{
        pathname: linkUrl,
        query: searchParams.toString()
      }}
      data-testid="stats-row"
      className={cn(
        "mb-2 last:mb-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex justify-between py-3 px-1 cursor-pointer text-sm",
        isFirst ? "font-black text-base" : "",
        isTop3
          ? "rounded shadow-md dark:shadow-md:white/30 bg-white/30 dark:bg-black/30"
          : ""
      )}
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
          <span
            className={cn(
              "min-w-20",
              isTop3 ? "font-bold" : "text-foreground",
              isFirst ? "text-base" : "",
              playerIndex !== undefined && !isTop3 ? "italic" : ""
            )}
            data-testid="object-name"
          >
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
