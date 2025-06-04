import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
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
  useFormContext
} from "react-hook-form";
import { createNextUrl } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import Image from "next/image";
import type {
  CS2LeetifyAvgRank,
  FaceITCSRank,
  Game,
  PlayerDetailsBySteamId,
  SignupFormValues
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import { AlertTriangle, TriangleAlert } from "lucide-react";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import { SignupPlayerNotification } from "./signup-player-alert";
import { FaceITLevelIcon } from "../profile/faceit-level";
import { CS2PremierRankBadge } from "../profile/cs2-premier-rank";
import { Spinner, TooltipIcon } from "../icons";
import Link from "next/link";

interface TabPlayersProps {
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
  playerErrorIndices: string[];
  seasonSteamAppId: Game["app_id"];
  platform: SeasonPlatform;
  seasonId: string;
  isEditMode: boolean;
  isDraft: boolean;
  validCaptainSelection: boolean;
}

export const TabPlayers = ({
  control,
  setValue,
  watch,
  playerErrorIndices,
  resetField,
  seasonSteamAppId,
  platform,
  seasonId,
  isEditMode,
  isDraft,
  validCaptainSelection
}: TabPlayersProps) => {
  const [promiseErrors, setPromiseErrors] = useState<Record<string, string[]>>(
    {}
  );
  const [newPlayers, setNewPlayers] = useState<string[]>([]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [hardCarrySteamId, setHardCarrySteamId] = useState("");
  const auth = useAuth();
  const { formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "players"
  });
  // Detect duplicate Steam ID error at array level
  const duplicateSteamIdError =
    typeof formState.errors?.players === "object" &&
    !Array.isArray(formState.errors.players) &&
    typeof formState.errors.players?.message === "string" &&
    formState.errors.players.message.includes("unique Steam ID");

  useEffect(() => {
    if (
      auth.user?.provider === "steam" &&
      auth.user?.provider_id &&
      !isEditMode &&
      !isDraft
    ) {
      setValue("players.0.accountId", auth.user.account_id);
      setValue("players.0.steamId", auth.user.provider_id);
      setValue("players.0.captain", true);
    }
  }, [auth.user, setValue, isEditMode, isDraft]);

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

  const steamIds = useWatch({ control, name: "players" }).map((p) => p.steamId);

  const [loadingStates, setLoadingStates] = useState<
    Record<number, boolean | undefined>
  >({});
  const prevWatchedSteamIds = useRef(isEditMode || isDraft ? [] : steamIds);
  // Open accordions if any errors
  useEffect(() => {
    const errorIndices: string[] = [];
    if (Array.isArray(formState.errors?.players)) {
      formState.errors.players.forEach((err, idx) => {
        if (err && (err as unknown as { steamId?: unknown }).steamId)
          errorIndices.push(`player-${idx}`);
      });
    }
    playerErrorIndices
      .map(Number)
      .filter((index) => !isNaN(index))
      .forEach((index) => errorIndices.push(`player-${index}`));
    // If duplicate error, open all accordions
    if (duplicateSteamIdError) {
      fields.forEach((_, idx) => errorIndices.push(`player-${idx}`));
    }

    // Check for real-time duplicates and open those accordions
    const steamIdCounts = new Map<string, number[]>();
    watchPlayers.forEach((player, idx) => {
      if (player.steamId && player.steamId.length > 0) {
        if (!steamIdCounts.has(player.steamId)) {
          steamIdCounts.set(player.steamId, []);
        }
        steamIdCounts.get(player.steamId)!.push(idx);
      }
    });

    // Add accordion indices for duplicate Steam IDs
    steamIdCounts.forEach((indices) => {
      if (indices.length > 1) {
        indices.forEach((idx) => errorIndices.push(`player-${idx}`));
      }
    });

    // Add accordion indices for players with validation issues
    watchPlayers.forEach((player, idx) => {
      if (player.steamId && player.steamId.length === 17) {
        // Check for various validation issues that should open the accordion
        if (
          player.isProfilePublic === false ||
          player.hours === -1 ||
          (player.rank === -1 && player.externalRank === -1) ||
          player.hasValidData === false ||
          player.isEmailVerified === false ||
          player.hasValidWorkEmail === false
        ) {
          errorIndices.push(`player-${idx}`);
        }
      }
    });

    if (errorIndices.length > 0) {
      setOpenItems(Array.from(new Set(errorIndices)));
    }
  }, [
    formState.errors,
    playerErrorIndices,
    fields,
    duplicateSteamIdError,
    watchPlayers
  ]);

  useEffect(() => {
    if (watchPlayers.length >= 5) {
      const validRanks = watchPlayers
        .map((player) => player.rank)
        .filter((rank) => typeof rank === "number")
        .filter((rank) => rank > 0);

      const validExternalRanks = watchPlayers
        .map((player) => player.externalRank)
        .filter((rank) => typeof rank === "number")
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

  useEffect(() => {
    const handlePlayer = async (steam_id: string | number, index: number) => {
      try {
        const steamId = String(steam_id);
        if (
          steamId.length === 17 &&
          !isNaN(Number(steamId)) &&
          !prevWatchedSteamIds.current.includes(steamId)
        ) {
          setLoadingStates((prev) => ({ ...prev, [index]: true }));

          // Fetch player hours, rank and platform rank first, as they should not return error
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
            setValue(`players.${index}.hours`, hoursData.value.hours);
          }

          if (rankData.status === "fulfilled") {
            setValue(`players.${index}.rank`, rankData.value.average_rank);
          }

          if (externalRankData.status === "fulfilled") {
            switch (platform) {
              case SeasonPlatform.FACEIT:
                setValue(
                  `players.${index}.externalRank`,
                  (externalRankData.value as FaceITCSRank).faceit_level
                );
            }
          }
          if (playerData.status === "fulfilled") {
            setValue(`players.${index}.accountId`, playerData.value.account_id);
            const data = playerData.value;
            const hasValidDataBool = Boolean(
              data.is_valid_full_name && data.has_accepted_latest_privacy_policy
            );
            setValue(`players.${index}.hasValidData`, hasValidDataBool);

            const isEmailVerified = Boolean(data.work_email_verified);
            setValue(`players.${index}.isEmailVerified`, isEmailVerified);

            const isValidWorkEmail = Boolean(data.is_valid_work_email);
            setValue(`players.${index}.hasValidWorkEmail`, isValidWorkEmail);

            if (!isValidWorkEmail) {
              // Check if organizer has approved manually
              if (watchTeamId) {
                const approvedByOrganizer = await clientApiFetch<{
                  employment_approved_by_organizer: boolean;
                }>(
                  `/api/v1/registrations/season/${seasonId}/team/${watchTeamId}/player/${steam_id}/approved-manually`
                );

                setValue(
                  `players.${index}.hasValidWorkEmail`,
                  approvedByOrganizer.employment_approved_by_organizer
                );
              }
            }

            if (data.nickname)
              setValue(`players.${index}.nickname`, data.nickname, {
                shouldValidate: true
              });
            if (data.discord)
              setValue(`players.${index}.discord`, data.discord, {
                shouldValidate: false
              });
          } else {
            if (playerData.reason instanceof ApiError) {
              if (playerData.reason.status === 404)
                setNewPlayers((prev) => [...prev, steamId]);
            }
          }

          const errorReasonsMessage: string[] = [];
          promises.forEach((promise) => {
            if (promise.status === "rejected") {
              errorReasonsMessage.push(
                promise.reason instanceof ApiError
                  ? promise.reason.message
                  : "Unknown error"
              );
            }
          });

          setPromiseErrors((prev) => {
            if (errorReasonsMessage.length > 0) {
              return {
                ...prev,
                [steam_id]: errorReasonsMessage
              };
            }
            return prev;
          });

          setLoadingStates((prev) => ({ ...prev, [index]: false }));
        }
      } catch (error) {
        console.error("Error fetching player data", error);
        setPromiseErrors((prev) => ({
          ...prev,
          [steam_id]:
            error instanceof ApiError ? [error.message] : ["Unknown error"]
        }));
        setLoadingStates((prev) => ({ ...prev, [index]: false }));
        throw error;
      }
    };

    const checkPlayers = async (steamIds: string[]) => {
      await Promise.allSettled(
        steamIds.map((steamId, index) => handlePlayer(steamId, index))
      );
    };

    checkPlayers(steamIds);
    prevWatchedSteamIds.current = steamIds;
  }, [platform, seasonId, seasonSteamAppId, setValue, steamIds, watchTeamId]);

  const onCapitanChange = (
    checked: CheckedState,
    index: number,
    capitanType: "captain" | "coCaptain"
  ) => {
    const isOtherCapitan = watch(
      `players.${index}.${capitanType === "captain" ? "coCaptain" : "captain"}`
    );
    if (checked) {
      if (isOtherCapitan) {
        setValue(
          `players.${index}.${capitanType === "captain" ? "coCaptain" : "captain"}`,
          false
        );
      }
      // Uncheck other captains
      watchPlayers.forEach((_, i) => {
        if (i !== index) setValue(`players.${i}.${capitanType}`, false);
      });
      setValue(`players.${index}.${capitanType}`, true);
    } else {
      setValue(`players.${index}.${capitanType}`, false);
    }
  };

  return (
    <TabsContent value="players">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Players</h3>
        <p>
          By default you are the captain, please remember to select co-captain.
        </p>
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {fields.map((field, index) => {
            const player = watch(`players.${index}`);

            const isHardCarry =
              hardCarrySteamId !== "" && hardCarrySteamId === player.steamId;

            const debugNickname = player.nickname;
            if (debugNickname) {
              // eslint-disable-next-line no-console
              console.log(`Rendering player-nickname-${index}:`, debugNickname);
            }

            const steamIdError = Array.isArray(formState.errors?.players)
              ? formState.errors.players[index]?.steamId
              : undefined;

            // Real-time duplicate detection - check if current Steam ID appears elsewhere in the form
            const currentSteamId = player.steamId;
            const isDuplicate =
              currentSteamId &&
              currentSteamId.length > 0 &&
              watchPlayers.filter((p) => p.steamId === currentSteamId).length >
                1;

            // Check if field is valid (no error, has value, and has loaded nickname indicating successful validation)
            const steamIdValid =
              !steamIdError &&
              !duplicateSteamIdError &&
              !isDuplicate &&
              player.steamId &&
              player.steamId.length === 17 &&
              player.nickname &&
              player.isProfilePublic !== false && // Must have public profile
              player.hours !== -1 && // Must have valid hours
              (player.rank !== -1 || player.externalRank !== -1) && // Must have valid rank
              player.hasValidData !== false && // Must have valid account data
              !loadingStates[index]; // Not currently loading

            // Check if field has validation issues that should show red border
            const hasValidationIssues =
              player.steamId &&
              player.steamId.length === 17 &&
              (player.isProfilePublic === false ||
                player.hours === -1 ||
                (player.rank === -1 && player.externalRank === -1) ||
                player.hasValidData === false ||
                player.isEmailVerified === false ||
                player.hasValidWorkEmail === false);

            return (
              <AccordionItem
                className="space-y-2 border-b-0"
                key={field.id}
                value={`player-${index}`}
              >
                <AccordionTrigger
                  className={
                    "border-1 p-4 w-full rounded-lg flex flex-col items-center xs:flex-row"
                  }
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
                            "Steam ID"
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              className={
                                "w-full " +
                                (steamIdError ||
                                duplicateSteamIdError ||
                                isDuplicate ||
                                hasValidationIssues
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                  : steamIdValid
                                    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                                    : "")
                              }
                              onClick={(e) => e.stopPropagation()}
                              disabled={loadingStates[index]}
                              data-testid={`steam-id-input-${index}`}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const oldValue = field.value;
                                if (newValue !== oldValue) {
                                  resetField(`players.${index}.nickname`);
                                  resetField(`players.${index}.discord`);
                                  setValue(
                                    `players.${index}.hasValidData`,
                                    undefined
                                  );
                                  setValue(
                                    `players.${index}.hasValidWorkEmail`,
                                    undefined
                                  );
                                  setValue(
                                    `players.${index}.isEmailVerified`,
                                    undefined
                                  );
                                  setValue(
                                    `players.${index}.isProfilePublic`,
                                    undefined
                                  );
                                  setValue(`players.${index}.hours`, -1);
                                  setValue(`players.${index}.rank`, -1);
                                  setValue(`players.${index}.externalRank`, -1);
                                  setLoadingStates((prev) => ({
                                    ...prev,
                                    [index]: undefined
                                  }));
                                }
                                field.onChange(e);
                              }}
                            />
                            {loadingStates[index] && (
                              <div className="absolute inset-y-0 right-2 flex items-center">
                                <Spinner />
                              </div>
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
                                onCapitanChange(checked, index, "captain")
                              }
                              disabled={
                                player.hasValidData === undefined &&
                                newPlayers.includes(player.steamId)
                              }
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
                                onCapitanChange(checked, index, "coCaptain")
                              }
                              disabled={
                                player.hasValidData === undefined &&
                                newPlayers.includes(player.steamId)
                              }
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

                  {/* If players.index.captain is checked, render discord field */}
                  {(player.captain || player.coCaptain) && (
                    <FormField
                      control={control}
                      name={`players.${index}.discord`}
                      render={({ field }) => (
                        <FormItem className="py-1 sm:py-2">
                          <FormLabel>Discord</FormLabel>
                          <FormControl>
                            <Input
                              disabled={true}
                              {...field}
                              data-testid={`player-discord-${index}`}
                            />
                          </FormControl>
                          <FormDescription className="text-primary text-xs pb-1">
                            {player.discord ? (
                              <SignupPlayerNotification type="info">
                                Can be updated in profile page
                              </SignupPlayerNotification>
                            ) : (
                              <SignupPlayerNotification>
                                User needs to fill in Discord nick in his
                                profile
                              </SignupPlayerNotification>
                            )}
                          </FormDescription>
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
                  {player.hasValidData === undefined &&
                    newPlayers.includes(player.steamId) && (
                      <SignupPlayerNotification type="warning">
                        A new player, perhaps. To Kanahub, login you must.
                      </SignupPlayerNotification>
                    )}

                  {player.hasValidData === false && (
                    <SignupPlayerNotification
                      data-testid={`policy-acceptance-error-${index}`}
                    >
                      Ask the player to sign up for Kanahub & Accept the latest
                      privacy policy.
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

                  {player.isProfilePublic === false && (
                    <SignupPlayerNotification
                      data-testid={`profile-privacy-error-${index}`}
                    >
                      Player steam profile is not public
                    </SignupPlayerNotification>
                  )}

                  {player.hours === -1 && (
                    <SignupPlayerNotification
                      data-testid={`hours-error-${index}`}
                    >
                      Could not detect the hours for the player. Please open a
                      ticket in the Kanaliiga Discord.
                    </SignupPlayerNotification>
                  )}

                  {player.rank === -1 &&
                    player.externalRank === -1 &&
                    platform !== SeasonPlatform.Kanaliiga && (
                      <SignupPlayerNotification
                        data-testid={`rank-error-${index}`}
                      >
                        {`Could not detect external ${platform.toLocaleUpperCase()} or game internal rank for the player. Please open a
                      ticket in the Kanaliiga Discord.`}
                      </SignupPlayerNotification>
                    )}

                  {prevWatchedSteamIds.current.filter(
                    (id) => !!id && id === player.steamId
                  ).length > 1 && (
                    <div className="text-yellow-500 text-xs flex gap-2 items-center py-1">
                      <TriangleAlert className="h-4 w-4" /> Duplicate steam id
                      detected
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    onClick={() => remove(index)}
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
                discord: "",
                captain: false,
                coCaptain: false
              });
            }}
            className="w-full my-2 sm:my-4"
            variant={"default"}
            data-testid="add-player-button"
          >
            Add Player
          </Button>
        )}
        {/* Show array-level error message for duplicate Steam ID */}
        {typeof formState.errors?.players === "object" &&
          !Array.isArray(formState.errors.players) &&
          typeof formState.errors.players?.message === "string" && (
            <div className="text-red-500 text-xs mt-2">
              {formState.errors.players.message}
            </div>
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
      </div>
    </TabsContent>
  );
};
