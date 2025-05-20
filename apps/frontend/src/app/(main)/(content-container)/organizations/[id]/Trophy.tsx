import { TrophyIcon } from "lucide-react";
import clsx from "clsx";

type TrophyProps = {
  placement: number;
  season: string;
  league: string;
};

export default function Trophy({ placement, season, league }: TrophyProps) {
  const colorMap: Record<number, string> = {
    1: "text-yellow-400",
    2: "text-slate-400",
    3: "text-amber-700"
  };

  const labelMap: Record<number, string> = {
    1: "CHAMPION",
    2: "FINALIST",
    3: "SEMI-FINALIST"
  };

  if (placement > 3) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 bg-card p-4 rounded-lg w-full md:w-auto">
      <TrophyIcon className={clsx("w-6 h-6", colorMap[placement])} />
      <div className="text-sm leading-tight">
        <div className="font-bold">
          {season} {labelMap[placement]}
        </div>
        <div className="text-muted-foreground text-xs uppercase tracking-wide">
          {league}
        </div>
      </div>
    </div>
  );
}
