"use client";

import { SeasonForm } from "@/components/dashboard/seasons/SeasonForm";
import { type SeasonFormRaw } from "@eggosystem/types";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";

export function SeasonsPageClient() {
  const handleSubmit = async (data: SeasonFormRaw) => {
    try {
      // Add timezone information to the request
      const requestData = {
        ...data,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const result = await clientApiFetch<{ seasonId: number }>(
        "/api/v1/dashboard/seasons",
        {
          method: "POST",
          body: JSON.stringify(requestData)
        }
      );

      toast.success(`Season created successfully! ID: ${result.seasonId}`);
    } catch (error) {
      console.error("Error creating season:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create season"
      );
      throw error; // Re-throw to let the form handle the error state
    }
  };

  return <SeasonForm onSubmit={handleSubmit} />;
}
