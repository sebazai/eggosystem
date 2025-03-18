"use client";
import { RequiresSteamLogin } from "@/components/layout/requires-steam-login";
import { TheContainer } from "@/components/layout/the-container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useSeason } from "@/hooks/data/useSeason";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FancySelect } from "@/components/filters/fancy-multi-select";
import { useOrganizationTeams } from "@/hooks/data/useOrganizationTeams";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MultiSelect } from "@/types/MultiSelectType";
import { TabOrganization } from "./signup-tab-organizations";

interface SignupFormProps {
  seasonId: string;
}

const maskedEmailRegex =
  /^[a-zA-Z0-9._%+-]{2,}\*+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const playerSchema = z.object({
  steam_id: z.string().length(17),
  name: z.string().min(2).max(50),
  work_email: z
    .string()
    .refine(
      (val) =>
        z.string().email().safeParse(val).success || maskedEmailRegex.test(val),
      {
        message: "Invalid email format."
      }
    )
});

const newOrganizationSchema = z.object({
  name: z.string().min(2).max(50),
  company_code: z.string().min(2).max(50),
  website: z.string().url()
});

const newTeamSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email()
});

const baseFormSchema = z.object({
  organizationId: z.number(),
  newOrganization: newOrganizationSchema.optional(),
  teamId: z.number(),
  newTeam: newTeamSchema.optional(),
  players: z.array(playerSchema).min(5).max(9)
});

const formSchema = baseFormSchema
  .refine(
    (data) => {
      if (data.organizationId === -1) {
        return (
          !!data.newOrganization?.name &&
          !!data.newOrganization?.company_code &&
          !!data.newOrganization?.website
        );
      }
      return true;
    },
    {
      message:
        "New organization details are required when 'Other...' is selected.",
      path: ["newOrganization"]
    }
  )
  .refine(
    (data) => {
      if (data.teamId === -1) {
        return !!data.newTeam?.name && !!data.newTeam?.email;
      }
      return true;
    },
    {
      message: "New team details are required when 'Other...' is selected.",
      path: ["newTeam"]
    }
  );

export type FormValues = z.infer<typeof formSchema>;

export const SignupForm = ({ seasonId }: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState("organization");
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const { user, loading: loadingUser } = useAuth();

  const [openItems, setOpenItems] = useState<string[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: undefined,
      teamId: undefined,
      players: Array(5).fill({
        steam_id: "",
        name: "",
        work_email: ""
      })
    }
  });

  const { control, setValue, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "players"
  });

  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  const steamIds = useWatch({ control, name: "players" }).map(
    (p) => p.steam_id
  );
  const watchOrgId = useWatch({ control, name: "organizationId" });
  const watchNewOrg = useWatch({ control, name: "newOrganization" });
  const watchTeamId = useWatch({ control, name: "teamId" });
  const watchNewTeam = useWatch({ control, name: "newTeam" });
  const watchPlayers = useWatch({ control, name: "players" });

  const { season, isLoading, isError, isValidating } = useSeason(seasonId);

  const {
    teams,
    isLoading: loadingTeams,
    isError: isErrorTeams,
    isValidating: isValidatingTeams
  } = useOrganizationTeams(form.getValues("organizationId"));

  const validOrgId = useMemo(
    () =>
      baseFormSchema
        .pick({
          organizationId: true
        })
        .safeParse({ organizationId: watchOrgId }),

    [watchOrgId]
  );
  const validOrg = useMemo(
    () =>
      baseFormSchema
        .pick({
          newOrganization: true
        })
        .safeParse({ newOrganization: watchNewOrg }),
    [watchNewOrg]
  );
  const validTeamId = useMemo(
    () =>
      baseFormSchema
        .pick({
          teamId: true
        })
        .safeParse({ teamId: watchTeamId }),
    [watchTeamId]
  );
  const validTeam = useMemo(
    () =>
      baseFormSchema
        .pick({
          newTeam: true
        })
        .safeParse({ newTeam: watchNewTeam }),
    [watchNewTeam]
  );
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

  const onSubmit = (data: FormValues) => {
    console.log("Submitted:", data);
  };

  if (
    isLoading ||
    isValidating ||
    loadingTeams ||
    isValidatingTeams ||
    loadingUser
  ) {
    return <TheContainer>Loading...</TheContainer>;
  }
  if (!user) {
    return <RequiresSteamLogin />;
  }

  if (isError || isErrorTeams || !season || !teams) {
    return (
      <TheContainer>
        {isError?.message ?? "Something went wrong..."}
      </TheContainer>
    );
  }

  const selectableTeams = teams
    .map((team) => ({
      value: team.id,
      label: team.name
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label)
    ) satisfies MultiSelect<number>[];

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };

  const onNext = (value: string) => {
    setActiveTab(value);
  };

  const validOrganizationSelection =
    (validOrgId.success !== false && validOrgId.data.organizationId !== -1) ||
    (validOrg.success !== false && validOrgId.data?.organizationId === -1);

  const validTeamSelection =
    (validTeamId.success !== false && validTeamId.data.teamId !== -1) ||
    (validTeam.success !== false && validTeamId.data?.teamId === -1);

  return (
    <div className="max-w-xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-semibold">Signup Form</h2>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="flex space-x-2">
                  <TabsTrigger value="organization">Organization</TabsTrigger>
                  <TabsTrigger
                    value="team"
                    disabled={!validOrganizationSelection}
                  >
                    Team
                  </TabsTrigger>
                  <TabsTrigger value="players" disabled={!validTeamSelection}>
                    Players
                  </TabsTrigger>
                </TabsList>

                <TabOrganization
                  control={control}
                  reset={reset}
                  onNext={onNext}
                  validOrganizationSelection={validOrganizationSelection}
                  watchOrgId={watchOrgId}
                />

                <TabsContent value="team">
                  <FormField
                    control={control}
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team</FormLabel>
                        <FormControl>
                          <FancySelect<number>
                            isMulti={false}
                            allowOther={true}
                            filter={"teams"}
                            selectable={selectableTeams ?? []}
                            placeholder="Select team"
                            currentSelection={
                              watchTeamId === -1
                                ? [{ value: -1, label: "Other" }]
                                : selectableTeams.filter(
                                    (team) => team.value === watchTeamId
                                  )
                            }
                            onSelectChange={(selectedItem) => {
                              if (!selectedItem) {
                                form.reset({
                                  teamId: undefined,
                                  newTeam: undefined,
                                  players: Array(5).fill({
                                    steam_id: "",
                                    name: "",
                                    work_email: ""
                                  })
                                });
                              }
                              field.onChange(selectedItem?.value);
                            }}
                            isOpen={openFilter === "teams"}
                            setOpen={handleOpen}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Team Input (Only if "Other" is selected) */}
                  {watchTeamId === -1 && (
                    <div className="pt-4 space-y-4">
                      <FormField
                        control={control}
                        name="newTeam.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Insert team name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="newTeam.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Insert team email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <Button
                    className="mt-5"
                    disabled={!validTeamSelection}
                    onClick={() => onNext("players")}
                  >
                    Next
                  </Button>
                </TabsContent>
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
                              loadingStates[index] &&
                                "border-yellow-500 animate-pulse",
                              validPlayers[index]?.result.success === true &&
                                "border-green-500",
                              validPlayers[index]?.result.success === false &&
                                validPlayers[index]?.player.steam_id.length ===
                                  17 &&
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
                                const steamId = form.watch(
                                  `players.${index}.steam_id`
                                );

                                return (
                                  <FormItem>
                                    <FormLabel>TV-friendly nickname</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={fetchedValidSteamIds.current.has(
                                          steamId
                                        )}
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
                                const steamId = form.watch(
                                  `players.${index}.steam_id`
                                );
                                return (
                                  <FormItem>
                                    <FormLabel>Work email</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={fetchedValidSteamIds.current.has(
                                          steamId
                                        )}
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
              </Tabs>
              <Button type="submit" variant="outline" className="w-full">
                Submit
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};
