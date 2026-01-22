"use client";

import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState } from "react";

interface FaceitSyncButtonProps {
  seasonId?: string | null;
}

export function FaceitSyncButton({ seasonId }: FaceitSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    if (!seasonId) {
      toast.error("Please select a season first");
      return;
    }

    setIsLoading(true);
    try {
      await clientApiFetch(`/api/v1/faceit/sync/season/${seasonId}`, {
        method: "POST"
      });

      toast.success("FACEIT sync initiated successfully");
    } catch (err) {
      console.error("FACEIT sync failed:", err);
      toast.error("Failed to sync FACEIT data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading || !seasonId}
      className="w-full"
    >
      {isLoading ? "Syncing..." : "Sync FACEIT Match schedules"}
    </Button>
  );
}
