"use client";

import { Button } from "@/components/ui/button";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useState } from "react";

export function FaceitSyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await clientApiFetch("/api/v1/faceit/sync", {
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
    <Button onClick={handleSync} disabled={isLoading} className="w-full">
      {isLoading ? "Syncing..." : "Sync FACEIT Match schedules"}
    </Button>
  );
}
