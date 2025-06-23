"use client";

import { useEffect, useState } from "react";
import { usePlayerSkillDiagram } from "@/hooks/data/usePlayerSkillDiagram";
import { PlayerSkillRadar } from "./PlayerSkillRadar";
import type { FilterParamsQuery } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import type { PlayerSkillDiagram } from "@eggosystem/types";
import { envConfig } from "@/configs/env";
import { generateFiltersParamQuery } from "@/lib/utils";

interface PlayerTeamDetails {
  team_id: number;
  team_name: string;
}

interface PlayerSkillTabProps {
  steamId: string;
  filterQueryParams: FilterParamsQuery;
}

export const PlayerSkillTab = ({
  steamId,
  filterQueryParams
}: PlayerSkillTabProps) => {
  const [compareOption, setCompareOption] = useState<string>("none");
  const [playerTeam, setPlayerTeam] = useState<PlayerTeamDetails | null>(null);
  const [_isLoadingTeam, setIsLoadingTeam] = useState(true);

  // Fetch player's team details when component loads
  useEffect(() => {
    const fetchPlayerTeam = async () => {
      try {
        setIsLoadingTeam(true);
        console.log("Fetching team details for player:", steamId);
        const response = await fetch(
          `${envConfig.API_URL}/api/v1/filters/players/${steamId}/teams${filterQueryParams ? `?${generateFiltersParamQuery(filterQueryParams)}` : ""}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Player team data received:", data);
          // The API returns an array, so we need to get the first team
          if (data && Array.isArray(data) && data.length > 0) {
            setPlayerTeam({
              team_id: data[0].team_id,
              team_name: data[0].team_name
            });
          } else {
            console.warn("Player has no teams in the response");
            setPlayerTeam(null);
          }
        } else {
          console.warn(
            "Could not fetch player team details, status:",
            response.status
          );
          setPlayerTeam(null);
        }
      } catch (error) {
        console.error("Error fetching player team:", error);
        setPlayerTeam(null);
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchPlayerTeam();
  }, [steamId, filterQueryParams]);

  const {
    playerSkillData,
    compareSkillData,
    isLoading,
    error,
    isCompareDataNotFound
  } = usePlayerSkillDiagram({
    steamId,
    compareOption,
    filterQueryParams,
    playerTeam: playerTeam
  });

  const handleCompareOptionChange = (option: string) => {
    setCompareOption(option);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load player skill data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Create placeholder data for loading state
  const placeholderData: PlayerSkillDiagram = {
    steam_id: "",
    nickname: "Loading...",
    overall_rating: 0,
    aim: 0,
    positioning: 0,
    impact: 0,
    utility: 0,
    consistency: 0,
    detailed_metrics: {} as PlayerSkillDiagram["detailed_metrics"]
  };

  if (isLoading || !playerSkillData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Player Skills</h2>
        <PlayerSkillRadar
          isLoading={true}
          playerSkillData={placeholderData}
          onCompareOptionChange={handleCompareOptionChange}
          initialCompareOption={compareOption}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">
        Player Skill Rating:{" "}
        <span className="text-kanaliiga-orange">
          {playerSkillData.overall_rating}/100
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-6">
        <PlayerSkillRadar
          playerSkillData={playerSkillData}
          compareSkillData={compareSkillData || undefined}
          isLoading={isLoading}
          onCompareOptionChange={handleCompareOptionChange}
          initialCompareOption={compareOption}
          isCompareDataNotFound={isCompareDataNotFound}
          playerTeam={playerTeam}
        />

        <div className="bg-card rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-lg mb-4">Skill Metrics Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Aim ({playerSkillData.aim}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Measures a player&apos;s mechanical shooting skills:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">Headshot percentage</span> -
                  Accuracy when aiming for headshots
                </li>
                <li>
                  <span className="font-medium">Time to damage</span> - How
                  quickly the player deals damage after spotting enemies
                </li>
                <li>
                  <span className="font-medium">Crosshair placement</span> - How
                  well the player pre-aims at head level
                </li>
                <li>
                  <span className="font-medium">Counter-strafing</span> -
                  Ability to stop movement for accurate shots
                </li>
                <li>
                  <span className="font-medium">Accuracy</span> - Overall
                  shooting precision
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Impact ({playerSkillData.impact}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Measures a player&apos;s influence on round outcomes:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">KAST</span> - Kill, Assist,
                  Survived, or Traded percentage
                </li>
                <li>
                  <span className="font-medium">Clutches</span> - Success rate
                  in last-player-standing situations
                </li>
                <li>
                  <span className="font-medium">Multi-kills</span> - Frequency
                  of double/triple kills per round
                </li>
                <li>
                  <span className="font-medium">KANA rating</span> - Overall
                  statistical performance
                </li>
                <li>
                  <span className="font-medium">1v1 success</span> - Win ratio
                  in one-versus-one situations
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Positioning ({playerSkillData.positioning}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Measures tactical awareness and positioning:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">First kill/death ratio</span> -
                  Success in opening duels
                </li>
                <li>
                  <span className="font-medium">Trade efficiency</span> - How
                  well player converts trade opportunities
                </li>
                <li>
                  <span className="font-medium">Tradeable deaths</span> -
                  Percentage of deaths in positions where teammates can trade
                </li>
                <li>
                  <span className="font-medium">Opening duel success</span> -
                  Performance in first engagements as T and CT
                </li>
                <li>
                  <span className="font-medium">Good deaths</span> - Deaths that
                  occur in advantageous team positions
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Utility ({playerSkillData.utility}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Measures grenade and flash effectiveness:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">Flash assists</span> - Kills
                  secured by teammates on flashed enemies
                </li>
                <li>
                  <span className="font-medium">Enemies flashed</span> - Average
                  number of enemies blinded per flash
                </li>
                <li>
                  <span className="font-medium">Flash duration</span> - Average
                  time enemies remain blinded
                </li>
                <li>
                  <span className="font-medium">HE damage</span> - Average
                  damage dealt with grenades per round
                </li>
                <li>
                  <span className="font-medium">Molotov damage</span> - Average
                  damage dealt with molotovs per round
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Consistency ({playerSkillData.consistency}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Measures performance stability across different scenarios:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">CT/T balance</span> - How
                  balanced performance is between sides
                </li>
                <li>
                  <span className="font-medium">Map consistency</span> - How
                  stable performance is across different maps
                </li>
                <li>
                  <span className="font-medium">Role balance</span> -
                  Consistency between entry fragging and clutch situations
                </li>
                <li>
                  <span className="font-medium">ADR variance</span> - How much
                  damage output fluctuates between matches
                </li>
                <li>
                  <span className="font-medium">KD variance</span> - How much
                  kill/death ratio varies between matches
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange mb-2">
                Overall Rating ({playerSkillData.overall_rating}/100)
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Comprehensive player skill rating based on all categories:
              </p>
              <ul className="list-disc pl-5 mb-3 text-sm text-muted-foreground space-y-1">
                <li>
                  <span className="font-medium">Aim</span> - 25% of overall
                  rating
                </li>
                <li>
                  <span className="font-medium">Impact</span> - 25% of overall
                  rating
                </li>
                <li>
                  <span className="font-medium">Positioning</span> - 20% of
                  overall rating
                </li>
                <li>
                  <span className="font-medium">Utility</span> - 15% of overall
                  rating
                </li>
                <li>
                  <span className="font-medium">Consistency</span> - 15% of
                  overall rating
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
