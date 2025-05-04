import { cn, createNextUrl } from "@/lib/utils";
import Image from "next/image";

interface RoundBreakdownProps {
  startingSide: "T" | "CT";
  roundWonFirstHalf: number;
  roundsWonSecondHalf: number;
  overtimeRoundsWon: number;
}

export const RoundBreakdown = ({
  overtimeRoundsWon,
  roundWonFirstHalf,
  roundsWonSecondHalf,
  startingSide
}: RoundBreakdownProps) => {
  const startedAsTerrorist = startingSide === "T";
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">Breakdown</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Image
            src={
              startedAsTerrorist
                ? createNextUrl("/images/t-side-crossed-swords.webp")
                : createNextUrl("/images/ct-side-pliers.webp")
            }
            alt={startedAsTerrorist ? "Terrorist" : "Counter-Terrorist"}
            width={16}
            height={16}
            className="mr-1"
          />
          <span
            className={cn(
              startedAsTerrorist ? "text-yellow-500" : "text-blue-500"
            )}
          >
            {roundWonFirstHalf}
          </span>
        </div>
        <div className="flex items-center">
          <Image
            src={
              !startedAsTerrorist
                ? createNextUrl("/images/t-side-crossed-swords.webp")
                : createNextUrl("/images/ct-side-pliers.webp")
            }
            alt={!startedAsTerrorist ? "Terrorist" : "Counter-Terrorist"}
            width={16}
            height={16}
            className="mr-1"
          />
          <span
            className={cn(
              !startedAsTerrorist ? "text-yellow-500" : "text-blue-500"
            )}
          >
            {roundsWonSecondHalf}
          </span>
        </div>
        {overtimeRoundsWon !== 0 && <div>({overtimeRoundsWon})</div>}
      </div>
    </div>
  );
};
