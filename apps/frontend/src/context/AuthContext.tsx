"use client";

import {
  clientApiFetch,
  setAuthFailureCallback,
  markValidSession,
  clearSessionState,
  refreshAccessToken
} from "@/lib/apiClient";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import type { UserFullPayload } from "@eggosystem/types";
import { toast } from "sonner";

interface AuthContextType {
  user: UserFullPayload | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserFullPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      await refreshAccessToken().catch(() => {});

      const res = await clientApiFetch<{ user: UserFullPayload }>(
        "/api/v1/auth/me"
      );
      setUser(res.user);
      // Mark that we've had a valid session
      markValidSession();
    } catch (_error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await clientApiFetch("/api/v1/auth/logout");
      toast.success("Logged out successfully");
    } finally {
      setUser(null);
      // Clear session state to prevent false auth failure triggers
      clearSessionState();
    }
  };

  // Register auth failure callback for automatic logout
  useEffect(() => {
    setAuthFailureCallback(() => {
      console.log("Auth failure detected, logging out user");
      setUser(null);
      // Only show session expired message if we had a valid session
      // This prevents false messages on first visit or after logout
      if (user !== null) {
        toast.error("Session expired. Please log in again.");
      }
    });
  }, [user]);

  useEffect(() => {
    const fetchAuth = async () => {
      if (user !== null) {
        setLoading(false);
        return;
      }
      await checkAuth();
    };

    fetchAuth();
  }, [checkAuth, user]);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
