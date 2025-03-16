"use client";

import { apiFetch } from "@/lib/apiClient";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserPayload } from "../../../../packages/types/src";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: UserPayload | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await apiFetch<{ user: UserPayload }>("/auth/me");
      setUser(res.user);
    } catch (_error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      router.push("/"); // Redirect to login page after logout
    }
  };

  useEffect(() => {
    const fetchAuth = async () => {
      await checkAuth(); // Await the async function
    };

    fetchAuth();
  }, []);

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
