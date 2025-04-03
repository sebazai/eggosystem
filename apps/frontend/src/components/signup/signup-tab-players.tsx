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
import { cn, createNextImageUrl, expressFetcher } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import type { PlayerBySteamId, SignupFormValues } from "@eggosystem/types";
import { playerSchema } from "@eggosystem/types";

interface TabPlayersProps {
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
  playerErrorIndices: string[];
}

export const TabPlayers = ({
  control,
  setValue,
  watch,
  playerErrorIndices,
  resetField
}: TabPlayersProps) => {
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
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { fields, append, remove } = useFieldArray({
    control,
    name: "players"
  });
  const validPlayers = useMemo(() => {
    return watchPlayers.map((player) => ({
      player,
      result: playerSchema.safeParse(player)
    }));
  }, [watchPlayers]);

  const prevWatchedSteamIds = useRef(steamIds);
  const fetchedValidSteamIds = useRef(new Set<string>());
  useEffect(() => {
    steamIds.forEach((steam_id, index) => {
      if (
        steam_id.length === 17 &&
        !prevWatchedSteamIds.current.includes(steam_id)
      ) {
        setLoadingStates((prev) => ({ ...prev, [index]: true }));

        expressFetcher<PlayerBySteamId>(`/api/v1/players/${steam_id}`)
          .then((data) => {
            if (data.name)
              setValue(`players.${index}.name`, data.name, {
                shouldValidate: true
              });
            setValue(
              `players.${index}.has_valid_full_name_in_db`,
              !!data.is_valid_full_name
            );

            if (data.work_email)
              setValue(`players.${index}.work_email`, data.work_email);

            if (data.discord)
              setValue(`players.${index}.discord`, data.discord, {
                shouldValidate: false
              });

            if (
              playerSchema.safeParse({
                ...data,
                steam_id: String(data.steam_id)
              }).success === false ||
              !data.is_valid_full_name
            ) {
              setOpenItems((prev) => [...prev, `player-${index}`]);
            } else {
              fetchedValidSteamIds.current.add(steam_id);
            }
          })
          .catch((error) => {
            console.error("Error fetching player data:", error);
            setValue(`players.${index}.name`, "");
            setValue(`players.${index}.work_email`, "");
            setOpenItems((prev) => [...prev, `player-${index}`]);
          })
          .finally(() => {
            setLoadingStates((prev) => ({ ...prev, [index]: false }));
          });
      }
    });

    prevWatchedSteamIds.current = steamIds;
  }, [setValue, steamIds]);

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
          {fields.map((field, index) => (
            <AccordionItem
              className="space-y-2 border-b-0"
              key={field.id}
              value={`player-${index}`}
            >
              <AccordionTrigger
                className={cn(
                  "border-1 p-4 w-full rounded-lg flex items-center",
                  loadingStates[index] && "border-yellow-500 animate-pulse",
                  validPlayers[index]?.result.success === true &&
                    "border-green-500",
                  validPlayers[index]?.result.success === false &&
                    validPlayers[index]?.player.steam_id.length === 17 &&
                    "border-red-500"
                )}
              >
                <FormField
                  control={control}
                  name={`players.${index}.steam_id`}
                  render={({ field }) => (
                    <FormItem className="w-100">
                      <FormLabel>Steam ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const oldValue = field.value;
                            if (oldValue.length === 17) {
                              fetchedValidSteamIds.current.delete(oldValue);
                            }
                            if (newValue !== oldValue) {
                              resetField(`players.${index}.name`);
                              resetField(`players.${index}.work_email`);
                              resetField(`players.${index}.discord`);
                              resetField(
                                `players.${index}.has_valid_full_name_in_db`
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

                {watch(`players.${index}.captain`) && (
                  <Image
                    src={createNextImageUrl("/images/captain.png")}
                    alt="Captain"
                    className="hidden xxs:block"
                    width={30}
                    height={23}
                  />
                )}
                {watch(`players.${index}.co_captain`) && (
                  <Image
                    src={createNextImageUrl("/images/co-captain.png")}
                    alt="Co-Captain"
                    className="hidden xxs:block"
                    width={30}
                    height={23}
                  />
                )}
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
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              onCapitanChange(checked, index, "co_captain")
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
                  name={`players.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steam nickname</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onClick={(e) => e.stopPropagation()}
                          disabled={fetchedValidSteamIds.current.has(
                            watch(`players.${index}.steam_id`)
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!watch(`players.${index}.has_valid_full_name_in_db`) && (
                  <FormField
                    control={control}
                    name={`players.${index}.full_name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onClick={(e) => e.stopPropagation()}
                            disabled={fetchedValidSteamIds.current.has(
                              watch(`players.${index}.steam_id`)
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={control}
                  name={`players.${index}.work_email`}
                  render={({ field }) => {
                    const steamId = watch(`players.${index}.steam_id`);
                    return (
                      <FormItem>
                        <FormLabel>Work email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onClick={(e) => e.stopPropagation()}
                            disabled={fetchedValidSteamIds.current.has(steamId)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* If players.index.captain is checked, render discord field */}
                {(watch(`players.${index}.captain`) ||
                  watch(`players.${index}.co_captain`)) && (
                  <FormField
                    control={control}
                    name={`players.${index}.discord`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  variant="destructive"
                  onClick={() => remove(index)}
                  type="button"
                  className="w-full"
                  disabled={fields.length <= 5} // Disable if less than 5 players
                >
                  Remove Player
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {fields.length < 9 && (
          <Button
            type="button"
            onClick={() => {
              append({
                steam_id: "",
                name: "",
                work_email: "",
                discord: "",
                captain: false,
                co_captain: false
              });
            }}
            className="w-full"
            variant={"default"}
          >
            Add Player
          </Button>
        )}
        <FormField
          control={control}
          name="defects"
          render={({ field }) => (
            <FormItem>
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
