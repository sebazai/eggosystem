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
import type {
  PlayerDetailsBySteamId,
  SignupFormValues
} from "@eggosystem/types";
import { playerSchema } from "@eggosystem/types";
import { TriangleAlert } from "lucide-react";

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
  useEffect(() => {
    steamIds.forEach((steam_id, index) => {
      if (
        steam_id.length === 17 &&
        !prevWatchedSteamIds.current.includes(steam_id)
      ) {
        setLoadingStates((prev) => ({ ...prev, [index]: true }));

        expressFetcher<PlayerDetailsBySteamId>(
          `/api/v1/players/${steam_id}/details`
        )
          .then((data) => {
            if (data.name)
              setValue(`players.${index}.name`, data.name, {
                shouldValidate: true
              });

            const has_valid_data = Boolean(
              data.is_valid_full_name &&
                data.is_valid_work_email &&
                data.has_accepted_latest_privacy_policy
            );
            setValue(`players.${index}.has_valid_data`, has_valid_data);

            if (data.discord)
              setValue(`players.${index}.discord`, data.discord, {
                shouldValidate: false
              });

            if (
              playerSchema.safeParse(data).success === false ||
              !has_valid_data
            ) {
              setOpenItems((prev) => [...prev, `player-${index}`]);
            }
          })
          .catch((_error) => {
            setValue(`players.${index}.name`, "");
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
                  validPlayers[index]?.player.has_valid_data === false &&
                    "border-yellow-500",
                  validPlayers[index]?.result.success === true &&
                    validPlayers[index]?.player.has_valid_data &&
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
                            if (newValue !== oldValue) {
                              resetField(`players.${index}.name`);
                              resetField(`players.${index}.discord`);
                              resetField(`players.${index}.has_valid_data`);
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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

                {!watch(`players.${index}.has_valid_data`) && (
                  <div className="text-yellow-500 text-xs flex gap-2 items-center">
                    <TriangleAlert className="h-4 w-4" /> Player needs to fill
                    in details in their Kanahub profile.
                  </div>
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
