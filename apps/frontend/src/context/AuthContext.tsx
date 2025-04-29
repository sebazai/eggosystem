"use client";

import { clientApiFetch } from "@/lib/apiClient";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import type { UserFullPayload } from "@eggosystem/types";

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
      const res = await clientApiFetch<{ user: UserFullPayload }>(
        "/api/v1/auth/me"
      );
      setUser(res.user);
    } catch (_error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await clientApiFetch("/api/v1/auth/logout");
    } finally {
      setUser(null);
    }
  };

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
