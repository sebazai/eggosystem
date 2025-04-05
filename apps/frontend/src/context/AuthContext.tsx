"use client";

import { apiFetch } from "@/lib/apiClient";
import { createContext, useContext, useEffect, useState } from "react";
import type { UserFullPayload } from "@eggosystem/types";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const res = await apiFetch<{ user: UserFullPayload }>({
        url: "/auth/me"
      });
      setUser(res.user);
      // Check if the user has accepted the privacy policy
      if (res.user.acceptedPrivacyPolicy === false) {
        router.push("/profile"); // Redirect to profile if privacy policy not accepted
      }
    } catch (_error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch({ url: "/auth/logout" });
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    const fetchAuth = async () => {
      await checkAuth(); // Await the async function
    };

    fetchAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Force redirect if the user is logged in but hasn't accepted the privacy policy
    if (
      user &&
      user.acceptedPrivacyPolicy === false &&
      !pathname.includes("profile") &&
      !pathname.includes("privacy-policy")
    ) {
      const urlEncodedPath = encodeURIComponent(pathname);
      router.push(
        `/profile?acceptPrivacyPolicyRequired=1&returnTo=${urlEncodedPath}`
      );
    }
  }, [user, router, pathname]);

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
