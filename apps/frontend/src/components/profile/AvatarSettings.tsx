"use client";

import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { AvatarUploadSection } from "./AvatarUploadSection";
import { ContentContainer } from "../layout/ContentContainer";
import { SteamLoginButton } from "./SteamLoginButton";

export const AvatarSettings = ({ steamId }: { steamId: string }) => {
  const { steamPlayer, isLoading, isError } = useSteamPlayer(steamId);

  if (!steamId) {
    return (
      <ContentContainer classNames="flex-col space-y-4">
        <div>Please log in to manage your avatar.</div>
        <SteamLoginButton />
      </ContentContainer>
    );
  }

  if (isLoading) {
    return <ContentContainer>Loading avatar...</ContentContainer>;
  }

  if (isError) {
    return (
      <ContentContainer>
        <div className="text-red-500">Failed to load player data.</div>
      </ContentContainer>
    );
  }

  return (
    <AvatarUploadSection
      currentAvatar={steamPlayer?.avatar}
      steamId={steamId}
    />
  );
};
