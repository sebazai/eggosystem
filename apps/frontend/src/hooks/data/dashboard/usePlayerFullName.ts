import { clientApiFetch } from "@/lib/apiClient";
import type { PlayerFullName } from "@eggosystem/types";
import { useEffect, useState } from "react";

export function usePlayerFullName(steamId: string) {
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isValidSteamId = steamId && /^[0-9]{17}$/.test(steamId);

    if (!isValidSteamId) {
      return;
    }

    let cancelled = false;

    const fetchFullName = async () => {
      if (cancelled) return;

      try {
        setLoading(true);
        setError(null);
        setFullName(null);

        const res = await clientApiFetch<PlayerFullName>(
          `/api/v1/dashboard/registration/players/${steamId}/full-name`,
          {
            method: "GET"
          }
        );

        if (!cancelled) {
          setFullName(res.full_name || null);
        }
      } catch {
        if (!cancelled) {
          setFullName(null);
          setError("Not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchFullName();

    return () => {
      cancelled = true;
    };
  }, [steamId]);

  return { fullName, loading, error };
}
