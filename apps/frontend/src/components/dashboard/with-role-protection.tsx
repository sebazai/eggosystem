"use client";

import { useAuth } from "@/context/AuthContext";
import { SteamLoginButton } from "../profile/steam-login";

type WithRoleProtectionProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export function WithRoleProtection({
  children,
  allowedRoles = ["admin"]
}: WithRoleProtectionProps) {
  const { user } = useAuth();

  const isAuthorized = user?.roles?.some((role) => allowedRoles.includes(role));

  if (!user)
    return (
      <div>
        No user. Please log in. <SteamLoginButton />
      </div>
    );
  if (!isAuthorized) return <h1>403 Forbidden</h1>;

  return <>{children}</>;
}
