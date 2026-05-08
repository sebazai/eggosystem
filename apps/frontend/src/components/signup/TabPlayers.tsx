import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormResetField,
  type UseFormSetValue,
  type UseFormWatch,
  type UseFormTrigger
} from "react-hook-form";
import {
  cn,
  createNextUrl,
  isValidSteamId,
  resolveSteamIdToSteamId64
} from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

import { useCallback, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import type {
  CS2LeetifyAvgRank,
  FaceITCSRank,
  Game,
  PlayerDetailsBySteamId,
  SeasonDetails,
  SignupFormValues,
  SignupPlayerType
} from "@eggosystem/types";
import { playerSchema, SeasonPlatform } from "@eggosystem/types";
import { AlertTriangle, Search, TriangleAlert } from "lucide-react";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import { SignupPlayerNotification } from "./SignupPlayerNotification";
import { FaceITLevelIcon } from "../profile/FaceITLevelIcon";
import { CS2PremierRankBadge } from "../profile/CS2PremierRankBadge";
import { Spinner } from "@/components/ui/spinner";
import { TooltipIcon } from "../ui/icons";
import Link from "next/link";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { RosterImportModal } from "./RosterImportModal";

type CheckedState = boolean | "indeterminate";
interface TabPlayersProps {
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
  trigger: UseFormTrigger<SignupFormValues>;
  playerErrorIndices: string[];
  seasonSteamAppId: Game["app_id"];
  platform: SeasonPlatform;
  seasonId: string;
  validCaptainSelection: boolean;
  prefilledPlayerSteamIds: string[];
  teamId?: number;
  isEditMode: boolean;
  submitInitiated: boolean;
  seasonDetails: SeasonDetails;
}

export const TabPlayers = ({
  control,
  setValue,
  watch,
  playerErrorIndices,
  resetField,
  trigger,
  seasonSteamAppId,
  platform,
  seasonId,
  validCaptainSelection,
  prefilledPlayerSteamIds,
  teamId,
  isEditMode,
  submitInitiated,
  seasonDetails
}: TabPlayersProps) => {
  const [promiseErrors, setPromiseErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [newPlayers, setNewPlayers] = useState<string[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [errorIndices, setErrorIndices] = useState<string[]>([]);
  const [hardCarrySteamId, setHardCarrySteamId] = useState("");
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [playerToRemoveIndex, setPlayerToRemoveIndex] = useState<number | null>(
    null
  );
  const [showRosterImportModal, setShowRosterImportModal] = useState(false);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "players"
  });

  // Handle errors from formState.errors.players
  useEffect(() => {
    const playerErrorIndicesAsNumber = playerErrorIndices
      .map(Number)
      .filter((index) => !isNaN(index));
    if (playerErrorIndicesAsNumber.length > 0) {
      setOpenItems(
        playerErrorIndicesAsNumber.map((index) => `player-${index}`)
      );
    }
  }, [playerErrorIndices]);

  const watchPlayers = useWatch({ control, name: "players" });
  const watchTeamId = useWatch({ control, name: "teamId" });
  const watchOrganizationId = useWatch({ control, name: "organizationId" });
  const steamIds = watchPlayers.map((p) => p.steamId);

  // Helper function to check if a player is fully valid and eligible based on season requirements
  const isPlayerFullyValid = (player: SignupPlayerType): boolean => {
    return (
      player.hasValidData === true &&
      player.hasValidWorkEmail === true &&
      player.isEmailVerified === true &&
      (!seasonDetails.premier_rank_required || player.rank !== -1) &&
      (!seasonDetails.faceit_rank_required || player.externalRank !== -1) &&
      (!seasonDetails.hours_played_required || player.hours !== -1) &&
      (!seasonDetails.profile_link_required || player.hours !== -1)
    );
  };

  /**
   * Resolves any Steam ID format (SteamID64, SteamID, SteamID3, or custom URL) to SteamID64.
   * @param input The Steam ID input in any format
   * @returns Resolved SteamID64 or null if resolution fails
   */
  const resolveSteamId = useCallback(
    async (input: string): Promise<string | null> => {
      // Try local conversion first (SteamID, SteamID3)
      const localConverted = await resolveSteamIdToSteamId64(input);
      if (localConverted) {
        return localConverted;
      }

      // If empty, return null
      if (!input.trim()) {
        return null;
      }

      // Try API resolution for custom URLs
      try {
        const response = await clientApiFetch<{ steamId64: string }>(
          `/api/v1/players/resolve/${encodeURIComponent(input.trim())}`
        );
        return response.steamId64;
      } catch (error) {
        if (error instanceof ApiError) {
          // Log error but don't throw - let the form validation handle it
          console.warn(
            `Failed to resolve Steam ID "${input}":`,
            error.detail || error.message
          );
        } else {
          console.warn(`Failed to resolve Steam ID "${input}":`, error);
        }
        return null;
      }
    },
    []
  );

  const handlePlayer = useCallback(
    async (steam_id: string | number, index: number) => {
      const steamId = String(steam_id);
      if (!isValidSteamId(steamId)) {
        return;
      }

      const errorReasonsMessage: string[] = [];

      try {
        setLoadingStates((prev) => ({ ...prev, [index]: true }));

        const promises = await Promise.allSettled([
          clientApiFetch<{
            hours: number;
          }>(
            `/api/v1/players/${steam_id}/app/${seasonSteamAppId}/hours?season_id=${seasonId}`
          ),
          clientApiFetch<CS2LeetifyAvgRank>(
            `/api/v1/players/${steam_id}/app/${seasonSteamAppId}/rank?season_id=${seasonId}`
          ),
          clientApiFetch<unknown>(
            `/api/v1/players/${steam_id}/platform/${platform}/rank?season_id=${seasonId}`
          ),
          clientApiFetch<PlayerDetailsBySteamId>(
            `/api/v1/players/${steam_id}/details`
          )
        ]);

        const [hoursData, rankData, externalRankData, playerData] = promises;

        if (hoursData.status === "fulfilled") {
          setValue(
            `players.${index}.hours`,
            hoursData.value.hours > 0 ? hoursData.value.hours : -1
          );
        } else {
          setValue(`players.${index}.hours`, -1);
          errorReasonsMessage.push(
            hoursData.reason instanceof ApiError
              ? hoursData.reason.message
              : "Unknown error fetching hours data"
          );
        }

        if (rankData.status === "fulfilled") {
          setValue(
            `players.${index}.rank`,
            rankData.value.average_rank > 0 ? rankData.value.average_rank : -1
          );
        } else {
          setValue(`players.${index}.rank`, -1);
          errorReasonsMessage.push(
            rankData.reason instanceof ApiError
              ? rankData.reason.message
              : "Unknown error fetching rank data"
          );
        }

        if (externalRankData.status === "fulfilled") {
          switch (platform) {
            case SeasonPlatform.FACEIT:
              setValue(
                `players.${index}.externalRank`,
                (externalRankData.value as FaceITCSRank).faceit_level
              );
              break;
            case SeasonPlatform.Kanaliiga:
              setValue(
                `players.${index}.externalRank`,
                (externalRankData.value as { kana_elo: number }).kana_elo
              );
              break;
          }
        } else {
          setValue(`players.${index}.externalRank`, -1);
          errorReasonsMessage.push(
            externalRankData.reason instanceof ApiError
              ? externalRankData.reason.message
              : "Unknown error fetching external rank data"
          );
        }

        if (playerData.status === "fulfilled") {
          setValue(`players.${index}.accountId`, playerData.value.account_id);
          const data = playerData.value;
          const hasValidDataBool = Boolean(data.is_valid_full_name);
          setValue(`players.${index}.hasValidData`, hasValidDataBool);

          const isEmailVerified = Boolean(data.work_email_verified);
          setValue(`players.${index}.isEmailVerified`, isEmailVerified);

          const isValidWorkEmail = Boolean(data.is_valid_work_email);
          setValue(`players.${index}.hasValidWorkEmail`, isValidWorkEmail);

          // Backend allows manual approval to bypass both unverified email and invalid work email
          const needsApprovalCheck =
            !isValidWorkEmail || !data.work_email_verified;
          const hasTeamOrOrg =
            watchTeamId != null || watchOrganizationId != null;
          if (needsApprovalCheck && hasTeamOrOrg) {
            const params = new URLSearchParams();
            if (watchTeamId != null) params.set("team_id", String(watchTeamId));
            if (watchOrganizationId != null)
              params.set("organization_id", String(watchOrganizationId));
            const approvedByOrganizer = await clientApiFetch<{
              approved_by_organizer: boolean;
            }>(
              `/api/v1/registrations/season/${seasonId}/player/${steam_id}/approved-manually?${params.toString()}`
            );
            const approved = approvedByOrganizer.approved_by_organizer;
            if (!isValidWorkEmail) {
              setValue(`players.${index}.hasValidWorkEmail`, approved);
            }
            if (!data.work_email_verified) {
              setValue(`players.${index}.isEmailVerified`, approved);
            }
          }

          if (data.nickname)
            setValue(`players.${index}.nickname`, data.nickname);
          // Set discordLinked status from API response
          setValue(
            `players.${index}.discordLinked`,
            Boolean(data.discord_linked)
          );
        } else {
          if (playerData.reason instanceof ApiError) {
            if (playerData.reason.status === 404) {
              // Player not found - this is a new player that needs to sign up
              setLoadingStates((prev) => ({ ...prev, [index]: false }));
              setNewPlayers((prev) => [...prev, steamId]);
            } else {
              // Use the detailed error message from RFC 7807 or fallback to generic message
              const errorMessage =
                playerData.reason.detail || playerData.reason.message;
              errorReasonsMessage.push(errorMessage);
            }
          } else {
            errorReasonsMessage.push("Unknown error fetching player data");
          }
        }

        if (errorReasonsMessage.length > 0) {
          setPromiseErrors((prev) => {
            return {
              ...prev,
              [steam_id]: errorReasonsMessage
            };
          });
        }
        setLoadingStates((prev) => ({ ...prev, [index]: false }));
      } catch (error) {
        setPromiseErrors((prev) => ({
          ...prev,
          [steam_id]:
            error instanceof ApiError
              ? [error.detail || error.message]
              : ["Unknown error"]
        }));
        setLoadingStates((prev) => ({ ...prev, [index]: false }));
      }
    },
    [
      platform,
      seasonId,
      seasonSteamAppId,
      setValue,
      watchOrganizationId,
      watchTeamId
    ]
  );

  // Add useEffect for initial data fetching if we receive steamIds from edit mode or draft
  useEffect(() => {
    const fetchInitialPlayerData = async () => {
      const validSteamIds = prefilledPlayerSteamIds.filter((id) =>
        isValidSteamId(id)
      );

      const uniqueSteamIds = [...new Set(validSteamIds)];

      if (uniqueSteamIds.length > 0) {
        await Promise.allSettled(
          uniqueSteamIds.map((steamId, index) => handlePlayer(steamId, index))
        );
      }
    };

    fetchInitialPlayerData();
  }, [handlePlayer, prefilledPlayerSteamIds]);

  const [loadingStates, setLoadingStates] = useState<
    Record<number, boolean | undefined>
  >({});

  const clearValuesForIndex = useCallback(
    (index: number) => {
      resetField(`players.${index}.nickname`);
      setValue(`players.${index}.hasValidData`, undefined);
      setValue(`players.${index}.hasValidWorkEmail`, undefined);
      setValue(`players.${index}.isEmailVerified`, undefined);
      setValue(`players.${index}.hours`, undefined);
      setValue(`players.${index}.rank`, undefined);
      setValue(`players.${index}.externalRank`, undefined);
      setLoadingStates((prev) => ({
        ...prev,
        [index]: undefined
      }));
    },
    [resetField, setValue]
  );

  /**
   * Handles manual search button click for nickname/provider_username/faceit_nickname resolution.
   * This is triggered when the user clicks the search button or presses Enter on a text input.
   */
  const handleManualSearch = useCallback(
    async (index: number, searchValue: string) => {
      if (!searchValue.trim()) {
        return;
      }

      // Clear previous values
      clearValuesForIndex(index);

      // Suppress validation by updating field without validation
      // This prevents validation errors from showing during the search process
      setValue(`players.${index}.steamId`, searchValue.trim(), {
        shouldValidate: false
      });

      // Set loading state
      setLoadingStates((prev) => ({
        ...prev,
        [index]: true
      }));

      try {
        // Try to resolve via API (handles nickname, provider_username, faceit_nickname, and custom URLs)
        const resolvedSteamId = await resolveSteamId(searchValue.trim());

        if (resolvedSteamId && isValidSteamId(resolvedSteamId)) {
          // Update the field with resolved SteamID64 and validate
          setValue(`players.${index}.steamId`, resolvedSteamId, {
            shouldValidate: true
          });
          // Trigger validation to clear any existing errors and validate the resolved SteamID64
          await trigger(`players.${index}.steamId`);

          // Check duplicates excluding the current player's Steam ID
          const otherSteamIds = steamIds.filter((_, i) => i !== index);
          if (!otherSteamIds.includes(resolvedSteamId)) {
            // Fetch player data
            await handlePlayer(resolvedSteamId, index);
          } else {
            // Duplicate Steam ID detected - clear loading state
            setLoadingStates((prev) => ({
              ...prev,
              [index]: false
            }));
          }
        } else {
          // Resolution failed - update field and validate to show error
          setValue(`players.${index}.steamId`, searchValue.trim(), {
            shouldValidate: true
          });
          await trigger(`players.${index}.steamId`);
          setLoadingStates((prev) => ({
            ...prev,
            [index]: false
          }));
        }
      } catch (_error) {
        // Error handling - update field and validate to show error
        setValue(`players.${index}.steamId`, searchValue.trim(), {
          shouldValidate: true
        });
        await trigger(`players.${index}.steamId`);
        setLoadingStates((prev) => ({
          ...prev,
          [index]: false
        }));
      }
    },
    [
      clearValuesForIndex,
      resolveSteamId,
      handlePlayer,
      steamIds,
      setValue,
      trigger
    ]
  );

  /**
   * Handles Steam ID input change, converting various formats to SteamID64.
   * Updates the input field with the converted value and triggers player data fetching.
   */
  const handleSteamIdChange = useCallback(
    async (
      index: number,
      newValue: string,
      oldValue: string,
      fieldOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      // Always update the field immediately for responsive typing
      fieldOnChange(e);

      if (newValue !== oldValue) {
        // If field is being cleared, just clear values
        if (!newValue.trim()) {
          clearValuesForIndex(index);
          return;
        }

        clearValuesForIndex(index);

        // Try to resolve Steam ID if it's not a valid SteamID64
        // Run this asynchronously after field update
        (async () => {
          let resolvedSteamId: string | null = null;

          // First, try local conversion (instant for SteamID/SteamID3)
          const localConverted = await resolveSteamIdToSteamId64(newValue);
          if (localConverted) {
            resolvedSteamId = localConverted;
            // Update the field with converted value
            setValue(`players.${index}.steamId`, resolvedSteamId, {
              shouldValidate: true
            });
            // Trigger validation to clear any existing errors
            await trigger(`players.${index}.steamId`);
          } else if (isValidSteamId(newValue)) {
            // Already valid SteamID64
            resolvedSteamId = newValue;
          } else {
            // Only try API resolution for custom Steam community URLs (/id/username)
            // Pattern: https://steamcommunity.com/id/username or http://steamcommunity.com/id/username
            // Allow trailing slashes and query parameters
            // Note: /profiles/ URLs are handled locally by resolveSteamIdToSteamId64
            const isCustomSteamUrl =
              /^https?:\/\/(?:www\.)?steamcommunity\.com\/id\/[^/?#]+(?:\/|$|\?|#)/i.test(
                newValue.trim()
              );

            if (isCustomSteamUrl) {
              // Try API resolution for custom URLs
              setLoadingStates((prev) => ({
                ...prev,
                [index]: true
              }));
              resolvedSteamId = await resolveSteamId(newValue);
              setLoadingStates((prev) => ({
                ...prev,
                [index]: false
              }));

              // Update the field with resolved SteamID64 if available
              if (resolvedSteamId) {
                setValue(`players.${index}.steamId`, resolvedSteamId, {
                  shouldValidate: true
                });
                // Trigger validation to clear any existing errors
                await trigger(`players.${index}.steamId`);
              }
            }
          }

          // If we have a valid SteamID64 and it's not a duplicate, fetch player data
          // Check duplicates excluding the current player's Steam ID
          const otherSteamIds = steamIds.filter((_, i) => i !== index);
          if (
            resolvedSteamId &&
            isValidSteamId(resolvedSteamId) &&
            !otherSteamIds.includes(resolvedSteamId)
          ) {
            handlePlayer(resolvedSteamId, index);
          }
        })();
      }
    },
    [
      clearValuesForIndex,
      resolveSteamId,
      handlePlayer,
      steamIds,
      setValue,
      trigger
    ]
  );

  const playerHasErrors = useCallback(
    (player: SignupPlayerType, isDuplicate?: boolean) => {
      const error =
        isValidSteamId(player.steamId) &&
        (playerSchema.safeParse(player).success === false ||
          !!isDuplicate ||
          player.hasValidData !== true ||
          player.hasValidWorkEmail !== true ||
          player.isEmailVerified !== true ||
          (seasonDetails.hours_played_required && player.hours === -1) ||
          (seasonDetails.profile_link_required && player.hours === -1) ||
          (seasonDetails.premier_rank_required && player.rank === -1) ||
          (seasonDetails.faceit_rank_required &&
            player.externalRank === -1 &&
            platform !== SeasonPlatform.Kanaliiga));
      return error;
    },
    [platform, seasonDetails]
  );

  // Open accordions if any errors
  useEffect(() => {
    const errorIndices: string[] = [];
    for (const [index, player] of watchPlayers.entries()) {
      const isDuplicate =
        watchPlayers.filter(
          (p) => p.steamId === player.steamId && p.steamId !== ""
        ).length > 1;

      if (loadingStates[index] === undefined && !isDuplicate) {
        continue;
      }

      const error = playerHasErrors(player, isDuplicate);

      if (error && !loadingStates[index]) {
        errorIndices.push(`player-${index}`);
      }
    }

    if (errorIndices.length > 0) {
      setOpenItems(errorIndices);
    }
    setErrorIndices(errorIndices);
  }, [loadingStates, playerHasErrors, watchPlayers]);

  // Hard carry detection
  useEffect(() => {
    if (watchPlayers.length >= 5) {
      const validRanks = watchPlayers
        .map((player) => player.rank)
        .filter((rank): rank is number => typeof rank === "number")
        .filter((rank) => rank > 0);

      const validExternalRanks = watchPlayers
        .map((player) => player.externalRank)
        .filter((rank): rank is number => typeof rank === "number")
        .filter((rank) => rank > 0);

      const sum = validRanks.reduce((acc, rank) => acc + rank, 0);
      const rankAvg = sum / validRanks.length;
      const sumExternal = validExternalRanks.reduce(
        (acc, rank) => acc + rank,
        0
      );
      const avgExternal = sumExternal / validExternalRanks.length;

      const highestRankedPlayer = watchPlayers
        .filter((player) => typeof player.rank === "number")
        .reduce(
          (best, current) => {
            return current.rank! > best.rank! ? current : best;
          },
          { rank: -Infinity } as (typeof watchPlayers)[number]
        );
      if (
        (highestRankedPlayer.rank &&
          highestRankedPlayer.rank - rankAvg >= 10000) ||
        (highestRankedPlayer.externalRank &&
          highestRankedPlayer.externalRank - avgExternal >= 4)
      ) {
        setHardCarrySteamId(highestRankedPlayer.steamId);
      }
    }
  }, [watchPlayers]);

  const onCaptainChange = (
    checked: CheckedState,
    index: number,
    captainType: "captain" | "coCaptain"
  ) => {
    const isOtherCapitan = watch(
      `players.${index}.${captainType === "captain" ? "coCaptain" : "captain"}`
    );
    if (checked) {
      if (isOtherCapitan) {
        setValue(
          `players.${index}.${captainType === "captain" ? "coCaptain" : "captain"}`,
          false
        );
      }
      // Uncheck other captains
      watchPlayers.forEach((_, i) => {
        if (i !== index) setValue(`players.${i}.${captainType}`, false);
      });
      setValue(`players.${index}.${captainType}`, true);
    } else {
      setValue(`players.${index}.${captainType}`, false);
    }
  };

  const handleRosterImport = (players: SignupPlayerType[]) => {
    // Set the imported players into the form
    // We need to ensure we have the right number of player slots
    const minPlayers = 5;
    const maxPlayers = 9;
    const importedCount = Math.min(players.length, maxPlayers);

    // Calculate how many slots we need
    const targetSlots = Math.max(importedCount, minPlayers);
    const currentLength = fields.length;

    // Remove excess players if current count exceeds target
    // Note: We need to remove from the end, and fields.length doesn't update synchronously
    // so we calculate how many to remove upfront
    const removeCount = currentLength - targetSlots;
    if (removeCount > 0) {
      // Create array of indices to remove (from end to start)
      const indicesToRemove = Array.from(
        { length: removeCount },
        (_, i) => currentLength - 1 - i
      );
      // Remove all at once by calling remove for each
      for (const idx of indicesToRemove) {
        remove(idx);
      }
    }

    // Add missing player slots if needed
    const addCount = importedCount - currentLength;
    if (addCount > 0) {
      for (let i = 0; i < addCount; i++) {
        append({
          accountId: 0,
          steamId: "",
          nickname: "",
          captain: false,
          coCaptain: false
        });
      }
    }

    // Set the player data
    players.slice(0, maxPlayers).forEach((player, index) => {
      setValue(`players.${index}.steamId`, player.steamId);
      setValue(`players.${index}.nickname`, player.nickname);
      setValue(`players.${index}.captain`, player.captain ?? false);
      setValue(`players.${index}.coCaptain`, player.coCaptain ?? false);
      // Clear other fields to trigger re-validation
      setValue(`players.${index}.hasValidData`, undefined);
      setValue(`players.${index}.hasValidWorkEmail`, undefined);
      setValue(`players.${index}.isEmailVerified`, undefined);
      setValue(`players.${index}.hours`, undefined);
      setValue(`players.${index}.rank`, undefined);
      setValue(`players.${index}.externalRank`, undefined);
    });

    // Trigger player data fetching for all imported players
    players.slice(0, maxPlayers).forEach((player, index) => {
      if (isValidSteamId(player.steamId)) {
        handlePlayer(player.steamId, index);
      }
    });
  };

  return (
    <TabsContent value="players">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Players</h3>
          {teamId && teamId !== -1 && !isEditMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRosterImportModal(true)}
              data-testid="roster-import-button"
            >
              Import roster
            </Button>
          )}
        </div>
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {fields.map((field, index) => {
            const player = watch(`players.${index}`);

            const isHardCarry =
              hardCarrySteamId !== "" && hardCarrySteamId === player.steamId;

            const hasErrors =
              playerErrorIndices.includes(index.toString()) ||
              errorIndices.includes(`player-${index.toString()}`);

            const isNewPlayer =
              newPlayers.includes(player.steamId) &&
              player.hasValidData === undefined;

            const isEmptySteamId = player.steamId === "";
            return (
              <AccordionItem
                className="space-y-2 border-b-0"
                key={field.id}
                value={`player-${index}`}
                data-testid={`player-accordion-${index}`}
              >
                <AccordionTrigger
                  className={
                    "border-1 p-4 w-full rounded-lg flex flex-col items-center xs:flex-row"
                  }
                  data-testid={`player-accordion-triggers`}
                >
                  <FormField
                    control={control}
                    name={`players.${index}.steamId`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>
                          {player.nickname ? (
                            <span>
                              Player:{" "}
                              <span
                                className="text-kanaliiga-orange"
                                data-testid={`player-nickname-${index}`}
                              >
                                {player.nickname}
                              </span>
                            </span>
                          ) : (
                            "Steam ID or Nickname"
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              className={cn(
                                "w-full ",
                                hasErrors &&
                                  !loadingStates[index] &&
                                  "border-red-500 focus:border-red-500 focus:ring-red-500",
                                !hasErrors &&
                                  !loadingStates[index] &&
                                  !isEmptySteamId &&
                                  "border-green-500 focus:border-green-500 focus:ring-green-500",
                                loadingStates[index] && "border-yellow-500",
                                // Add padding for search button when visible
                                !isValidSteamId(field.value) &&
                                  field.value.trim() !== "" &&
                                  !loadingStates[index] &&
                                  "pr-10"
                              )}
                              onClick={(e) => e.stopPropagation()}
                              disabled={loadingStates[index]}
                              data-testid={`steam-id-input-${index}`}
                              onBlur={() => {
                                // Suppress validation on blur if we're currently loading (searching)
                                // This prevents validation errors from showing during the search process
                                if (!loadingStates[index]) {
                                  field.onBlur();
                                }
                              }}
                              onChange={async (e) => {
                                await handleSteamIdChange(
                                  index,
                                  e.target.value,
                                  field.value,
                                  field.onChange,
                                  e
                                );
                              }}
                              onKeyDown={async (e) => {
                                // Allow Enter key to trigger search for non-Steam ID inputs
                                if (
                                  e.key === "Enter" &&
                                  !isValidSteamId(field.value) &&
                                  field.value.trim() !== "" &&
                                  !loadingStates[index]
                                ) {
                                  e.preventDefault();
                                  await handleManualSearch(index, field.value);
                                }
                              }}
                            />
                            {loadingStates[index] && (
                              <div
                                data-testid="loading-spinner"
                                className="absolute inset-y-0 right-2 flex items-center"
                              >
                                <Spinner />
                              </div>
                            )}
                            {!loadingStates[index] &&
                              !isValidSteamId(field.value) &&
                              field.value.trim() !== "" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute inset-y-0 right-0 h-full w-10 rounded-l-none"
                                  onMouseDown={(e) => {
                                    // Prevent the button from taking focus, which would trigger onBlur validation
                                    e.preventDefault();
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await handleManualSearch(
                                      index,
                                      field.value
                                    );
                                  }}
                                  data-testid={`search-button-${index}`}
                                  aria-label="Search by nickname"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </FormControl>
                        <FormMessage data-testid={`steam-id-error-${index}`} />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-row w-full items-center justify-around gap-2">
                    {player.externalRank && (
                      <FaceITLevelIcon level={player.externalRank} />
                    )}

                    {player.rank && (
                      <CS2PremierRankBadge rankScore={player.rank} />
                    )}

                    {player.captain && (
                      <Image
                        src={createNextUrl("/images/captain.png")}
                        alt="Captain"
                        width={30}
                        height={23}
                      />
                    )}
                    {player.coCaptain && (
                      <Image
                        src={createNextUrl("/images/co-captain.png")}
                        alt="Co-Captain"
                        width={30}
                        height={23}
                      />
                    )}
                    {isHardCarry && (
                      <TooltipIcon
                        text={
                          "Note: Player is Hard carry for the team - make sure he plays all games"
                        }
                        icon={
                          <AlertTriangle className="text-yellow-500 min-w-5 min-h-5" />
                        }
                      />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="w-full p-4 border-t space-y-3">
                  <div className="flex items-center gap-4">
                    <FormField
                      control={control}
                      name={`players.${index}.captain`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                onCaptainChange(checked, index, "captain")
                              }
                              disabled={isNewPlayer}
                              data-testid={`captain-checkbox-${index}`}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            Captain
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`players.${index}.coCaptain`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 py-1 sm:py-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                onCaptainChange(checked, index, "coCaptain")
                              }
                              disabled={isNewPlayer}
                              data-testid={`co-captain-checkbox-${index}`}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            Co-Captain
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name={`players.${index}.nickname`}
                    render={({ field }) => (
                      <FormItem className="py-1 sm:py-2">
                        <FormLabel>Steam nickname</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onClick={(e) => e.stopPropagation()}
                            disabled={true}
                            data-testid={`player-name-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* If players.index.captain is checked, render discord status */}
                  {(player.captain || player.coCaptain) && (
                    <FormField
                      control={control}
                      name={`players.${index}.discordLinked`}
                      render={({ field }) => (
                        <FormItem className="py-1 sm:py-2">
                          <FormLabel>Discord</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              {field.value ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                  <span>✓</span>
                                  <span>Discord linked</span>
                                </div>
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <SignupPlayerNotification>
                                    User needs to link Discord in their profile
                                    if they want to be a captain or co-captain
                                  </SignupPlayerNotification>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {promiseErrors[player.steamId] && (
                    <SignupPlayerNotification type="alert">
                      <div className="flex flex-col">
                        <span>
                          {`Error fetching data for player ${player.steamId}`}
                        </span>
                        <div className="flex flex-col">
                          {promiseErrors[player.steamId]?.map((error, i) => (
                            <span key={i} className="text-sm">
                              {error}
                            </span>
                          ))}
                        </div>
                      </div>
                    </SignupPlayerNotification>
                  )}

                  {isHardCarry && (
                    <SignupPlayerNotification type="warning">
                      {`Note: Player is Hard carry for the team - make sure he plays all games`}
                    </SignupPlayerNotification>
                  )}

                  {isNewPlayer && (
                    <SignupPlayerNotification type="warning">
                      A new player, perhaps. To Kanahub, login you must.
                    </SignupPlayerNotification>
                  )}

                  {player.hasValidData === false && (
                    <SignupPlayerNotification
                      data-testid={`policy-acceptance-error-${index}`}
                    >
                      Ask the player to sign up for Kanahub.
                    </SignupPlayerNotification>
                  )}

                  {player.isEmailVerified === false &&
                    player.hasValidData !== false && (
                      <SignupPlayerNotification
                        data-testid={`email-verification-error-${index}`}
                      >
                        <div>
                          <span>Player has not verified their email.</span>
                        </div>
                      </SignupPlayerNotification>
                    )}

                  {player.hasValidWorkEmail === false &&
                    player.hasValidData !== false && (
                      <SignupPlayerNotification
                        data-testid={`work-email-validation-error-${index}`}
                      >
                        <div>
                          <span>
                            Player does not have a valid work email or has not
                            been approved by organizer, open a ticket in
                            Discord. See{" "}
                            <Link
                              target="_blank"
                              href="https://wiki.kanaliiga.fi/CS2/Registration#work-email"
                            >
                              registration info
                            </Link>
                          </span>
                        </div>
                      </SignupPlayerNotification>
                    )}

                  {player.hours === -1 &&
                    seasonDetails.hours_played_required && (
                      <SignupPlayerNotification
                        data-testid={`hours-error-${index}`}
                      >
                        <span>
                          Could not detect the hours for the player. Please
                          ensure that the{" "}
                          <Link
                            href="https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276"
                            target="_blank"
                            rel="noreferrer"
                            className="inline text-kanaliiga-orange"
                          >
                            Steam profile and Game details are set to public
                          </Link>
                          .<br />
                          Also, make sure the{" "}
                          <strong>
                            &quot;Always keep my total playtime private even if
                            users can see my game details&quot;
                          </strong>{" "}
                          option is <strong>unchecked</strong>.<br />
                          <em>
                            Note: Changes to Steam privacy settings may take a
                            few minutes to take effect.
                          </em>
                          <br />
                          If the profile is correctly set to public and the
                          issue persists, please open a ticket in the Kanaliiga
                          Discord.
                        </span>
                      </SignupPlayerNotification>
                    )}

                  {player.hours === -1 &&
                    seasonDetails.profile_link_required &&
                    !seasonDetails.hours_played_required && (
                      <SignupPlayerNotification
                        data-testid={`profile-link-error-${index}`}
                      >
                        <span>
                          Steam profile must be public. Please ensure that the{" "}
                          <Link
                            href="https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276"
                            target="_blank"
                            rel="noreferrer"
                            className="inline text-kanaliiga-orange"
                          >
                            Steam profile is set to public
                          </Link>{" "}
                          so the organizer can verify the player.
                          <br />
                          <em>
                            Note: Changes to Steam privacy settings may take a
                            few minutes to take effect.
                          </em>
                          <br />
                          If the profile is correctly set to public and the
                          issue persists, please open a ticket in the Kanaliiga
                          Discord.
                        </span>
                      </SignupPlayerNotification>
                    )}

                  {player.rank === -1 &&
                    seasonDetails.premier_rank_required && (
                      <SignupPlayerNotification
                        data-testid={`rank-error-${index}`}
                      >
                        Could not detect internal game rank for the player. This
                        could be due to temporary service issues or missing rank
                        data. Please try removing the steam id and adding it
                        again, or open a ticket in the Kanaliiga Discord if the
                        problem persists.
                      </SignupPlayerNotification>
                    )}

                  {player.externalRank === -1 &&
                    seasonDetails.faceit_rank_required &&
                    platform !== SeasonPlatform.Kanaliiga && (
                      <SignupPlayerNotification
                        data-testid={`external-rank-error-${index}`}
                      >
                        Could not detect external {platform.toLocaleUpperCase()}{" "}
                        rank for the player. This could be due to temporary
                        service issues or missing rank data. Please try removing
                        the steam id and adding it again, or open a ticket in
                        the Kanaliiga Discord if the problem persists.
                      </SignupPlayerNotification>
                    )}

                  {steamIds.filter((id) => !!id && id === player.steamId)
                    .length > 1 && (
                    <div className="text-yellow-500 text-xs flex gap-2 items-center py-1">
                      <TriangleAlert className="h-4 w-4" /> Duplicate steam id
                      detected
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (isPlayerFullyValid(player)) {
                        setPlayerToRemoveIndex(index);
                        setShowRemoveConfirmation(true);
                      } else {
                        remove(index);
                      }
                    }}
                    type="button"
                    className="w-full mt-1 sm:mt-4"
                    disabled={fields.length <= 5} // Disable if less than 5 players
                    data-testid={`remove-player-button-${index}`}
                  >
                    Remove Player
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {fields.length < 9 && (
          <Button
            type="button"
            onClick={() => {
              append({
                accountId: 0,
                steamId: "",
                nickname: "",
                captain: false,
                coCaptain: false
              });
            }}
            className="w-full my-2 sm:my-4"
            variant={"default"}
            data-testid="add-player-button"
            disabled={submitInitiated}
          >
            Add Player
          </Button>
        )}

        {/* Show captain/co-captain validation error in real-time */}
        {!validCaptainSelection && watchPlayers.length >= 5 && (
          <div
            className="text-red-500 text-xs mt-2"
            data-testid="captain-validation-error"
          >
            There must be exactly one captain and one co-captain.
          </div>
        )}

        <ConfirmationModal
          open={showRemoveConfirmation}
          onOpenChange={setShowRemoveConfirmation}
          onConfirm={() => {
            if (playerToRemoveIndex !== null) {
              remove(playerToRemoveIndex);
              setPlayerToRemoveIndex(null);
            }
          }}
          title="Remove Player"
          description={
            playerToRemoveIndex !== null
              ? `Are you sure you want to remove ${watchPlayers[playerToRemoveIndex]?.nickname || "this player"}? This player is fully valid and eligible.`
              : "Are you sure you want to remove this player?"
          }
          confirmText="Remove"
          cancelText="Cancel"
          confirmVariant="destructive"
        />

        <RosterImportModal
          teamId={teamId}
          open={showRosterImportModal}
          onOpenChange={setShowRosterImportModal}
          onImport={handleRosterImport}
        />
      </div>
    </TabsContent>
  );
};
