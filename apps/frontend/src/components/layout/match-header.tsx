import { cn } from "@/lib/utils";
import Image from "next/image";

interface TeamInfo {
  name: string;
  logo: string;
  score: number;
  rank: number;
}

interface MatchHeaderProps {
  team1: TeamInfo;
  team2: TeamInfo;
  matchTime: string;
  matchDate: string;
  className?: string;
}

export function MatchHeader({
  team1,
  team2,
  matchTime,
  matchDate,
  className
}: MatchHeaderProps) {
  return (
    <div
      className={cn("w-full text-white", className)}
      style={{ backgroundColor: "hsla(25, 70%, 20%, 0.7)" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Team 1 */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-orange-400">
                {team1.name}
              </span>
              <div className="h-8 w-8 relative">
                <Image
                  src={team1.logo}
                  alt={`${team1.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-sm text-zinc-400">
              Valve ranking #{team1.rank}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{team1.score}</span>
            <span className="text-lg text-zinc-400 uppercase">vs</span>
            <span className="text-4xl font-bold">{team2.score}</span>
          </div>
          <div className="text-sm text-zinc-400">
            {matchTime} - {matchDate}
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 relative">
                <Image
                  src={team2.logo}
                  alt={`${team2.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-orange-400">
                {team2.name}
              </span>
            </div>
            <span className="text-sm text-zinc-400">
              Valve ranking #{team2.rank}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
