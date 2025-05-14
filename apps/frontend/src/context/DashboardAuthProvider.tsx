// app/providers/dashboard-auth-provider.tsx
"use client";

import { clientApiFetch } from "@/lib/apiClient";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isLoading: boolean;
};

const DashboardAuthContext = createContext<AuthContextType>({
  isLoading: true
});

export function DashboardAuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      await refreshToken();
      setIsLoading(false);
    }

    initialize();
  }, []);

  return (
    <DashboardAuthContext.Provider value={{ isLoading }}>
      {!isLoading && children}
    </DashboardAuthContext.Provider>
  );
}

async function refreshToken() {
  console.log("Refreshing token...");
  await clientApiFetch("/api/v1/dashboard");
}

export function useDashboardAuth() {
  return useContext(DashboardAuthContext);
}
