"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { AuthLoading } from "@/components/loading";
import { SettingsTabs } from "./_components/SettingsTabs";

export default function ProfilePage() {
  useEffect(() => {
    document.title = "User profile | Kanahub";
  }, []);

  const { user, loading, checkAuth } = useAuth();

  // Refresh token and user on mount so roles updated after e.g. caster approval show immediately
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return (
      <ContentContainer>
        <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-12">
          <div className="space-y-2 text-center">
            <h2>Authentication required</h2>
            <p className="text-muted-foreground">
              Please log in to view and manage your profile.
            </p>
          </div>
          <SteamLoginButton />
        </div>
      </ContentContainer>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pb-1">User profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Kanahub identity, connected accounts, and how we contact
          you.
        </p>
      </div>

      <Suspense fallback={<AuthLoading />}>
        <SettingsTabs user={user} checkAuth={checkAuth} />
      </Suspense>
    </div>
  );
}
