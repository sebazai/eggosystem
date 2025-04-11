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
  type UseFormWatch
} from "react-hook-form";
import { cn, createNextImageUrl } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import type {
  FaceITCSRank,
  Game,
  PlayerDetailsBySteamId,
  SignupFormValues
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import { playerSchema } from "@eggosystem/types";
import { TriangleAlert } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/apiClient";
import { SignupPlayerNotification } from "./signup-player-alert";
import { FaceITLevelIcon } from "../profle/faceit-level";
import { CS2PremierRankBadge } from "../profle/cs2-premier-rank";

interface TabPlayersProps {
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
  playerErrorIndices: string[];
  seasonSteamAppId: Game["app_id"];
  platform: SeasonPlatform;
  seasonId: string;
}

export const TabPlayers = ({
  control,
  setValue,
  watch,
  playerErrorIndices,
  resetField,
  seasonSteamAppId,
  platform,
  seasonId
}: TabPlayersProps) => {
  const [newPlayers, setNewPlayers] = useState<string[]>([]);
  const auth = useAuth();
  useEffect(() => {
    if (auth.user?.steamId) {
      setValue("players.0.steam_id", auth.user.steamId);
      setValue("players.0.captain", true);
    }
  }, [auth.user, setValue]);

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

  const steamIds = useWatch({ control, name: "players" }).map(
    (p) => p.steam_id
  );

  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  // Open accordions if any errors
  useEffect(() => {
    const errorIndices: string[] = [];
    for (const [index, player] of watchPlayers.entries()) {
      if (
        !loadingStates[index] &&
        player.steam_id.length === 17 &&
        (playerSchema.safeParse(player).success === false ||
          !player.has_valid_data ||
          !player.is_profile_public ||
          player.hours === -1 ||
          player.rank === -1)
      ) {
        errorIndices.push(`player-${index}`);
      }
    }
    setOpenItems(errorIndices);
  }, [loadingStates, watchPlayers]);

  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "players"
  });

  const prevWatchedSteamIds = useRef(steamIds);
  useEffect(() => {
    const checkPlayers = async (steamIds: string[]) => {
      for (const [index, steam_id] of steamIds.entries()) {
        if (
          steam_id.length === 17 &&
          !isNaN(Number(steam_id)) &&
          !prevWatchedSteamIds.current.includes(steam_id)
        ) {
          setLoadingStates((prev) => ({ ...prev, [index]: true }));

          // Fetch player hours, rank and platform rank first, as they should not return error
          const [
            hoursData,
            rankData,
            externalRankData,
            publicStatus,
            playerData
          ] = await Promise.allSettled([
            apiFetch<{
              hours: number;
            }>({
              url: `/players/${steam_id}/app/${seasonSteamAppId}/hours?season_id=${seasonId}`
            }),
            apiFetch<{ rank: number }>({
              url: `/players/${steam_id}/app/${seasonSteamAppId}/rank?season_id=${seasonId}`
            }),
            apiFetch<unknown>({
              url: `/players/${steam_id}/platform/${platform}/rank`
            }),
            apiFetch<{ public: boolean }>({
              url: `/players/${steam_id}/public`
            }),
            apiFetch<PlayerDetailsBySteamId>({
              url: `/players/${steam_id}/details`
            })
          ]);

          // Only set values if the promises were fulfilled
          if (publicStatus.status === "fulfilled") {
            setValue(
              `players.${index}.is_profile_public`,
              publicStatus.value.public
            );
          }

          if (hoursData.status === "fulfilled") {
            setValue(`players.${index}.hours`, hoursData.value.hours);
          }

          if (rankData.status === "fulfilled") {
            setValue(`players.${index}.rank`, rankData.value.rank);
          }

          if (externalRankData.status === "fulfilled") {
            switch (platform) {
              case SeasonPlatform.FACEIT:
                setValue(
                  `players.${index}.external_rank`,
                  (externalRankData.value as FaceITCSRank).faceit_level
                );
            }
          }
          if (playerData.status === "fulfilled") {
            const data = playerData.value;
            const has_valid_data = Boolean(
              data.is_valid_full_name &&
                data.is_valid_work_email &&
                data.has_accepted_latest_privacy_policy
            );
            setValue(`players.${index}.has_valid_data`, has_valid_data);
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
                setNewPlayers((prev) => [...prev, steam_id]);
            }
          }
          setLoadingStates((prev) => ({ ...prev, [index]: false }));
        }
      }
    };

    checkPlayers(steamIds);
    prevWatchedSteamIds.current = steamIds;
  }, [platform, seasonId, seasonSteamAppId, setValue, steamIds]);

  const onCapitanChange = (
    checked: CheckedState,
    index: number,
    capitanType: "captain" | "co_captain"
  ) => {
    const isOtherCapitan = watch(
      `players.${index}.${capitanType === "captain" ? "co_captain" : "captain"}`
    );
    if (checked) {
      if (isOtherCapitan) {
        setValue(
          `players.${index}.${capitanType === "captain" ? "co_captain" : "captain"}`,
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

            const playerOk =
              player.steam_id.length === 17 &&
              playerSchema.safeParse(player).success &&
              player.has_valid_data &&
              player.is_profile_public;
            return (
              <AccordionItem
                className="space-y-2 border-b-0"
                key={field.id}
                value={`player-${index}`}
              >
                <AccordionTrigger
                  className={cn(
                    "border-1 p-4 w-full rounded-lg flex flex-col items-center xs:flex-row",
                    loadingStates[index] && "border-yellow-400 animate-pulse",
                    playerOk && "border-green-500",
                    !playerOk &&
                      player.steam_id.length === 17 &&
                      !loadingStates[index] &&
                      "border-red-500"
                  )}
                >
                  <FormField
                    control={control}
                    name={`players.${index}.steam_id`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Steam ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                            onClick={(e) => e.stopPropagation()}
                            disabled={loadingStates[index]}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              const oldValue = field.value;
                              if (newValue !== oldValue) {
                                resetField(`players.${index}.nickname`);
                                resetField(`players.${index}.discord`);
                                setValue(
                                  `players.${index}.has_valid_data`,
                                  undefined
                                );
                                setValue(
                                  `players.${index}.is_profile_public`,
                                  undefined
                                );
                                setValue(`players.${index}.hours`, undefined);
                                setValue(`players.${index}.rank`, undefined);
                                setValue(
                                  `players.${index}.external_rank`,
                                  undefined
                                );
                              }
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-row w-full items-center justify-around gap-2">
                    {player.external_rank && (
                      <FaceITLevelIcon level={player.external_rank} />
                    )}

                    {player.rank && (
                      <CS2PremierRankBadge rankScore={player.rank} />
                    )}

                    {player.captain && (
                      <Image
                        src={createNextImageUrl("/images/captain.png")}
                        alt="Captain"
                        width={30}
                        height={23}
                      />
                    )}
                    {player.co_captain && (
                      <Image
                        src={createNextImageUrl("/images/co-captain.png")}
                        alt="Co-Captain"
                        width={30}
                        height={23}
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
                                player.has_valid_data === undefined &&
                                newPlayers.includes(player.steam_id)
                              }
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
                      name={`players.${index}.co_captain`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 py-1 sm:py-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                onCapitanChange(checked, index, "co_captain")
                              }
                              disabled={
                                player.has_valid_data === undefined &&
                                newPlayers.includes(player.steam_id)
                              }
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
                            disabled={
                              player.has_valid_data === undefined &&
                              newPlayers.includes(player.steam_id)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* If players.index.captain is checked, render discord field */}
                  {(player.captain || player.co_captain) && (
                    <FormField
                      control={control}
                      name={`players.${index}.discord`}
                      render={({ field }) => (
                        <FormItem className="py-1 sm:py-2">
                          <FormLabel>Discord</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {player.has_valid_data === undefined &&
                    newPlayers.includes(player.steam_id) && (
                      <SignupPlayerNotification type="warning">
                        A new player, perhaps. To Kanahub, login you must.
                      </SignupPlayerNotification>
                    )}

                  {player.has_valid_data === false && (
                    <SignupPlayerNotification>
                      Ask the player to sign up for Kanahub.
                    </SignupPlayerNotification>
                  )}

                  {player.is_profile_public === false && (
                    <SignupPlayerNotification>
                      Player steam profile is not public
                    </SignupPlayerNotification>
                  )}

                  {player.hours === -1 && (
                    <SignupPlayerNotification>
                      Could not detect the hours for the player. Please open a
                      ticket in the Kanaliiga Discord.
                    </SignupPlayerNotification>
                  )}

                  {player.rank === -1 &&
                    player.external_rank === -1 &&
                    platform !== SeasonPlatform.Kanaliiga && (
                      <SignupPlayerNotification>
                        {`Could not detect external ${platform.toLocaleUpperCase()} or game internal rank for the player. Please open a
                      ticket in the Kanaliiga Discord.`}
                      </SignupPlayerNotification>
                    )}

                  {prevWatchedSteamIds.current.filter(
                    (id) => !!id && id === player.steam_id
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
                steam_id: "",
                nickname: "",
                discord: "",
                captain: false,
                co_captain: false
              });
            }}
            className="w-full my-2 sm:my-4"
            variant={"default"}
          >
            Add Player
          </Button>
        )}
        <FormField
          control={control}
          name="defects"
          render={({ field }) => (
            <FormItem className="my-2 sm:my-4">
              <FormLabel>Defects</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </TabsContent>
  );
};
