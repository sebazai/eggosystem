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
  type UseFormSetValue,
  type UseFormWatch
} from "react-hook-form";
import type { PlayerSchemaType, SignupFormValues } from "./signup-form";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

import { useEffect, useMemo, useRef, useState } from "react";

interface TabPlayersProps {
  control: Control<SignupFormValues>;
  playerSchema: PlayerSchemaType;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
}

export const TabPlayers = ({
  control,
  playerSchema,
  setValue,
  watch
}: TabPlayersProps) => {
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
  }, [playerSchema, watchPlayers]);

  const prevWatchedSteamIds = useRef(steamIds);
  const fetchedValidSteamIds = useRef(new Set<string>());
  useEffect(() => {
    steamIds.forEach((steam_id, index) => {
      if (
        steam_id.length === 17 &&
        !prevWatchedSteamIds.current.includes(steam_id)
      ) {
        setLoadingStates((prev) => ({ ...prev, [index]: true }));

        fetch(`/api/players/${steam_id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.name)
              setValue(`players.${index}.name`, data.name, {
                shouldValidate: true
              });

            if (data.work_email)
              setValue(`players.${index}.work_email`, data.work_email, {
                shouldValidate: false
              });

            if (!data.name || !data.work_email) {
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
  return (
    <TabsContent value="players">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Players</h3>
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
        >
          {fields.map((field, index) => (
            <AccordionItem key={field.id} value={`player-${index}`}>
              <AccordionTrigger
                className={cn(
                  "border-2 p-4 w-full rounded-lg flex items-center",
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
                          onChange={(e) => field.onChange(e)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionTrigger>
              <AccordionContent className="w-full p-4 border-t space-y-3">
                <FormField
                  control={control}
                  name={`players.${index}.name`}
                  render={({ field }) => {
                    const steamId = watch(`players.${index}.steam_id`);

                    return (
                      <FormItem>
                        <FormLabel>TV-friendly nickname</FormLabel>
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
                work_email: ""
              });
            }}
            className="w-full"
            variant={"secondary"}
          >
            Add Player
          </Button>
        )}
      </div>
    </TabsContent>
  );
};
