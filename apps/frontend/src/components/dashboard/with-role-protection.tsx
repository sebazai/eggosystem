"use client";

import { useAuth } from "@/context/AuthContext";

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

  if (!user) return <div>Loading...</div>;
  if (!isAuthorized) return <h1>403 Forbidden</h1>;

  return <>{children}</>;
}
