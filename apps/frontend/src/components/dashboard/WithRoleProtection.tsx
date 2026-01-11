"use client";

import { useAuth } from "@/context/AuthContext";
import { SteamLoginButton } from "../profile/SteamLoginButton";
import { Spinner } from "../ui/spinner";

type WithRoleProtectionProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export function WithRoleProtection({
  children,
  allowedRoles = ["admin"]
}: WithRoleProtectionProps) {
  const { user, loading } = useAuth();

  const isAuthorized = user?.roles?.some((role) => allowedRoles.includes(role));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">
            Ensuring authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
            <p className="text-sm text-muted-foreground">
              Please log in to access this page
            </p>
          </div>
          <SteamLoginButton />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-6xl font-bold text-destructive">403</h1>
          <h2 className="text-2xl font-semibold">Forbidden</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to access this page
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
