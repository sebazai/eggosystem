"use client";

import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import { AvatarUploadSection } from "./AvatarUploadSection";
import { ContentContainer } from "../layout/ContentContainer";

export const AvatarSettings = ({ steamId }: { steamId: string }) => {
  const { steamPlayer, isError } = useSteamPlayer(steamId);

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
