import { clientApiFetch } from "@/lib/apiClient";
import type { PlayerFullName } from "@eggosystem/types";
import { useEffect, useState } from "react";

export function usePlayerFullName(steamId: string) {
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!steamId || !/^[0-9]{17}$/.test(steamId)) {
      setFullName(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setFullName(null);
    clientApiFetch<PlayerFullName>(
      `/api/v1/dashboard/registration/players/${steamId}/full-name`,
      {
        method: "GET"
      }
    )
      .then(async (res) => {
        console.log("res", res);
        setFullName(res.full_name || null);
      })
      .catch(() => {
        setFullName(null);
        setError("Not found");
      })
      .finally(() => setLoading(false));
  }, [steamId]);

  return { fullName, loading, error };
}
