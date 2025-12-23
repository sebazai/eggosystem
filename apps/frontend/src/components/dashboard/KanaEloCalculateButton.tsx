"use client";

import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState } from "react";

interface CalculateKanaEloResponse {
  message: string;
  total_players: number;
  successful: number;
  failed: number;
  errors?: Array<{ steam_id: string; error: string }>;
}

export function KanaEloCalculateButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const response = await clientApiFetch<CalculateKanaEloResponse>(
        "/api/v1/dashboard/players/kanaelo/bulk",
        {
          method: "POST"
        }
      );

      if (response.failed > 0) {
        toast.warning(
          `Calculated kana_elo for ${response.successful} players (${response.failed} failed)`
        );
      } else {
        toast.success(
          `Successfully calculated kana_elo for ${response.successful} players`
        );
      }
    } catch (err) {
      console.error("KanaElo calculation failed:", err);
      toast.error("Failed to calculate kana_elo for all players");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleCalculate} disabled={isLoading} className="w-full">
      {isLoading ? "Calculating..." : "Calculate KanaElo for All Players"}
    </Button>
  );
}
