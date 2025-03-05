import { apiFetch } from "@/lib/apiClient";
import type { Nullable, UserPayload } from "@eggosystem/types";
import { useEffect, useState } from "react";

export default function useSession() {
  const [user, setUser] = useState<Nullable<UserPayload>>(null);

  useEffect(() => {
    apiFetch<{ user: UserPayload }>("/auth/me").then((data) => {
      if (data) {
        setUser(data.user);
      }
    });
  }, []);

  return user;
}
