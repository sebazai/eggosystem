import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createNextUrl } from "@/lib/utils";

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
  teamName
}: StatsGridRowProps) => {
  const searchParams = useSearchParams();
  return (
    <Link
      href={{
        pathname: linkUrl,
        query: searchParams.toString()
      }}
      data-testid="stats-row"
      className="flex justify-between py-3 hover:bg-kanaliiga-light-brown/10 cursor-pointer"
    >
      <div className="flex items-center gap-5">
        <span
          className="w-6 text-center text-muted-foreground"
          data-testid="placement"
        >
          {placement}
        </span>
        {teamLogo && (
          <Image
            src={createNextUrl(`/teams/${teamLogo}`)}
            alt={`${teamName} logo`}
            width={20}
            height={20}
            className="rounded-full flex-shrink-0"
          />
        )}

        <div className="flex items-center gap-2">
          <span
            className="font-bold text-kanaliiga-light-brown min-w-20"
            data-testid="object-name"
          >
            {columnOneText}
          </span>
          {columnTwoText && (
            <span className="hidden sm:block md:hidden text-muted-foreground text-sm min-w-15 break-all lg:block">
              {columnTwoText}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="hidden text-muted-foreground text-xs xs:block min-w-10"
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
