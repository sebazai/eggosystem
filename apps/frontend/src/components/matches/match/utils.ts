import { SeasonPlatform } from "@eggosystem/types";

export const createExternalMatchRoomUrl = (
  externalMatchId: string | null,
  platform: SeasonPlatform
) => {
  if (!externalMatchId) return null;
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return `https://www.faceit.com/en/cs2/room/${externalMatchId}`;
    default:
      return null;
  }
};
