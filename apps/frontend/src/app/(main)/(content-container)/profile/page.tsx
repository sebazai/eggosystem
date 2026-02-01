"use client";

import ProfileForm from "@/components/profile/ProfileForm";
import { CasterUrlSettings } from "@/components/profile/CasterUrlSettings";
import { DiscordSettings } from "@/components/profile/DiscordSettings";
import { AvatarSettings } from "@/components/profile/AvatarSettings";
import { useAuth } from "@/context/AuthContext";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { useEffect } from "react";
import { hasCasterAccess } from "@/lib/roleUtils";
import { AuthLoading } from "@/components/loading";

export default function ProfilePage() {
  useEffect(() => {
    document.title = "User profile | Kanahub";
  }, []);
  const { user, loading, checkAuth } = useAuth();

  // Refresh token and user when landing on this page so roles (e.g. after approval) are up to date
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return (
      <ContentContainer>
        <div className="flex flex-col items-center gap-6 py-12 max-w-md mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
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
      <h1 className="pb-4">User profile</h1>
      <AvatarSettings steamId={user.provider_id} />
      <ProfileForm user={user} checkAuth={checkAuth} />
      <DiscordSettings
        discordLinked={user.discordLinked}
        checkAuth={checkAuth}
      />
      <CasterUrlSettings canManageUrls={hasCasterAccess(user)} />
    </div>
  );
}
