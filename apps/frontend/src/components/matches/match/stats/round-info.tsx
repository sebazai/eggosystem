import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn, createStatsKanaliigaImageUrl } from "@/lib/utils";
import {
  RoundEndReasonInfo,
  type MapRoundInfo,
  type MapRoundStat
} from "@eggosystem/types";
import Image from "next/image";
import React from "react";

interface RoundInfoProps {
  roundInfo: MapRoundInfo[];
}

const getEndReasonText = (
  endReason: RoundEndReasonInfo,
  plantSite?: MapRoundStat["plant_site"]
) => {
  if (endReason === RoundEndReasonInfo.BombDefused) {
    return `Bomb defuse (Site ${plantSite})`;
  }
  if (endReason === RoundEndReasonInfo.TargetBombed) {
    return `Target bombed (Site ${plantSite})`;
  }
  if (endReason === RoundEndReasonInfo.TargetSaved) {
    return "Target saved";
  }
  if (endReason === RoundEndReasonInfo.T_Win) {
    if (plantSite) {
      return `Killed all CT (Bomb planted ${plantSite})`;
    }
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

const getWinnerChar = (round: MapRoundInfo) => {
  const CT_WON =
    round.round_end_reason_info === RoundEndReasonInfo.BombDefused ||
    round.round_end_reason_info === RoundEndReasonInfo.TargetSaved ||
    round.round_end_reason_info === RoundEndReasonInfo.CT_WIN;
  return CT_WON ? "ct" : "t";
};

const RoundRows = ({
  roundInfo,
  roundWinners,
  lengthOfGame,
  teamOne,
  teamTwo,
  isOvertime
}: {
  roundInfo: MapRoundInfo[];
  roundWinners: Record<number, number>;
  lengthOfGame: number;
  teamOne: { id: number; logo: string; name: string };
  teamTwo: { id: number; logo: string; name: string };
  isOvertime: boolean;
}) => {
  const isMobile = useIsMobile();
  return (
    <div className="flex gap-1">
      <div className="border-r-1 pr-4">
        <Image
          className="min-w-8 min-h-8 max-w-8 max-h-8 mb-4"
          src={createStatsKanaliigaImageUrl(teamOne.logo)}
          alt={teamOne.name}
          width={100}
          height={100}
        />
        <Image
          className="min-w-8 min-h-8 max-w-8 max-h-8 mb-4"
          src={createStatsKanaliigaImageUrl(teamTwo.logo)}
          alt={teamTwo.name}
          width={100}
          height={100}
        />
      </div>
      {roundInfo.map((round, index) => {
        const CT_WON =
          round.round_end_reason_info === RoundEndReasonInfo.BombDefused ||
          round.round_end_reason_info === RoundEndReasonInfo.TargetSaved ||
          round.round_end_reason_info === RoundEndReasonInfo.CT_WIN;
        const teamWinnerId = roundWinners[round.round_number];
        const halfWayRoundMarker = lengthOfGame / 2;
        if (index + 1 > lengthOfGame && !isOvertime) return;
        return (
          <div
            key={index}
            className={cn(
              "mb-4",
              !isOvertime && index + 1 === halfWayRoundMarker
                ? "border-r-1 pr-1"
                : "",
              isOvertime && (index - 2) % 6 === 0 ? "border-r-1 pr-1" : "",
              isOvertime &&
                (index + 1) % 6 == 0 &&
                index + 1 !== roundInfo.length
                ? "border-r-1 border-kanaliiga-orange pr-1"
                : ""
            )}
          >
            <div className="mb-4">
              {teamWinnerId === teamOne.id ? (
                <RoundIcon isMobile={isMobile} round={round} CT_WON={CT_WON} />
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </div>
            <div className="mb-4">
              {teamWinnerId === teamTwo.id ? (
                <RoundIcon isMobile={isMobile} round={round} CT_WON={CT_WON} />
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RoundIcon = ({
  round,
  CT_WON,
  isMobile
}: {
  round: MapRoundInfo;
  CT_WON: boolean;
  isMobile: boolean;
}) => {
  const content = (
    <div className="relative w-full h-full flex items-center justify-center text-xl cursor-help">
      {getIcon(round.round_end_reason_info)}
    </div>
  );

  const tooltipText = getEndReasonText(
    round.round_end_reason_info,
    round.plant_site
  );

  return (
    <div
      className={cn(
        "relative w-8 h-8 flex items-center justify-center mb-2 rounded",
        CT_WON ? "bg-blue-500/20" : "bg-yellow-500/20"
      )}
    >
      {isMobile ? (
        <Popover>
          <PopoverTrigger asChild>{content}</PopoverTrigger>
          <PopoverContent
            side="top"
            className="text-sm rounded shadow-lg z-[100]"
          >
            {tooltipText}
          </PopoverContent>
        </Popover>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="text-sm rounded shadow-lg z-[100]"
          >
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      )}
      <span className="absolute -bottom-6 text-xs text-muted-foreground">
        {round.round_number}
      </span>
    </div>
  );
};

export const RoundInfo = ({ roundInfo }: RoundInfoProps) => {
  const firstRound = roundInfo[0];
  if (!roundInfo || !firstRound) return null;
  const roundsInGame = firstRound.regulation_rounds;

  const teamOne = {
    id: firstRound.t_team_id,
    logo: firstRound.t_logo,
    name: firstRound.t_name
  };
  const teamTwo = {
    id: firstRound.ct_team_id,
    logo: firstRound.ct_logo,
    name: firstRound.ct_name
  };

  const roundWinnerByTeamId = roundInfo.reduce(
    (acc: Record<number, number>, round) => {
      const winningTeamIdKey: keyof MapRoundInfo = `${getWinnerChar(round)}_team_id`;

      acc[round.round_number] = round[winningTeamIdKey];
      return acc;
    },
    {}
  );

  const overtimeRounds = roundInfo.slice(roundsInGame);

  return (
    <TooltipProvider>
      <div className="mb-4 p-4 relative overflow-x-auto">
        <h2 className="mb-4">ROUND HISTORY</h2>

        <div className="min-w-[max-content]">
          <div className="flex gap-2">
            <RoundRows
              teamOne={teamOne}
              teamTwo={teamTwo}
              roundInfo={roundInfo}
              roundWinners={roundWinnerByTeamId}
              lengthOfGame={roundsInGame}
              isOvertime={false}
            />
          </div>

          {overtimeRounds.length < roundsInGame && (
            <Separator className="bg-kanaliiga-orange w-full my-2" />
          )}
        </div>

        {overtimeRounds.length > 0 && (
          <div className="min-w-[max-content]">
            {overtimeRounds.length > roundsInGame && (
              <Separator className="bg-kanaliiga-orange w-full my-2" />
            )}
            <h3 className="mb-4">Overtime</h3>
            <RoundRows
              teamOne={teamOne}
              teamTwo={teamTwo}
              roundInfo={roundInfo.slice(roundsInGame)}
              roundWinners={roundWinnerByTeamId}
              lengthOfGame={roundsInGame}
              isOvertime={true}
            />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
