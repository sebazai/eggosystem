import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { RoundEndReasonInfo, type MatchRoundInfo } from "@eggosystem/types";

interface RoundInfoProps {
  roundInfo: MatchRoundInfo[];
}

const getEndReasonText = (endReason: RoundEndReasonInfo) => {
  if (endReason === RoundEndReasonInfo.BombDefused) {
    return "Bomb defuse";
  }
  if (endReason === RoundEndReasonInfo.TargetBombed) {
    return "Target bombed";
  }
  if (endReason === RoundEndReasonInfo.TargetSaved) {
    return "Target saved";
  }
  if (endReason === RoundEndReasonInfo.T_Win) {
    return "Killed all CT";
  }
  if (endReason === RoundEndReasonInfo.CT_WIN) {
    return "Killed all T";
  }
  return "Unknown reason";
};

const getIcon = (endReason: RoundEndReasonInfo) => {
  if (endReason === RoundEndReasonInfo.BombDefused) {
    return "🔧";
  }
  if (endReason === RoundEndReasonInfo.TargetBombed) {
    return "💥";
  }
  if (endReason === RoundEndReasonInfo.TargetSaved) {
    return "⏱️";
  }
  return "💀";
};

export const RoundInfo = ({ roundInfo }: RoundInfoProps) => {
  return (
    <TooltipProvider>
      <div className="mb-4 p-4 bg-card">
        <h2 className="text-base font-bold mb-4">ROUND INFO</h2>
        <div className="flex flex-wrap gap-2">
          {roundInfo.map((round, index) => {
            const CT_WON =
              round.round_end_reason_info === RoundEndReasonInfo.BombDefused ||
              round.round_end_reason_info === RoundEndReasonInfo.TargetSaved ||
              round.round_end_reason_info === RoundEndReasonInfo.CT_WIN;
            return (
              <div
                key={index}
                className="relative w-8 h-8 flex items-center justify-center mb-6"
              >
                <div
                  className={`absolute inset-0 ${
                    CT_WON ? "bg-blue-500/20" : "bg-yellow-500/20"
                  } rounded`}
                ></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className={`relative w-full h-full flex items-center justify-center text-xl cursor-help ${
                        CT_WON ? "text-blue-400" : "text-yellow-500"
                      }`}
                    >
                      {getIcon(round.round_end_reason_info)}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm rounded shadow-lg z-[100]"
                  >
                    <p>{getEndReasonText(round.round_end_reason_info)}</p>
                  </TooltipContent>
                </Tooltip>
                <span className="absolute -bottom-6 text-xs text-muted-foreground">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};
