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
        Player Skills{" "}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Aim ({playerSkillData.aim}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Measures mechanical skills including headshot percentage,
                accuracy, and damage output.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Impact ({playerSkillData.impact}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Measures influence on round outcomes including clutches,
                multi-kills, and KAST.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Positioning ({playerSkillData.positioning}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Measures tactical awareness including opening duels, trade
                efficiency, and survival.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Utility ({playerSkillData.utility}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Measures grenade and flash effectiveness including damage,
                enemies flashed, and assists.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Consistency ({playerSkillData.consistency}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Measures performance stability across maps, sides, and roles.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-kanaliiga-orange">
                Overall Rating ({playerSkillData.overall_rating}/100)
              </h4>
              <p className="text-sm text-muted-foreground">
                Combined score based on all skill categories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
