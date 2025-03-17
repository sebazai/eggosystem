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
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { FancySelect } from "@/components/filters/fancy-multi-select";
import { useTeams } from "@/hooks/data/useTeams";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MultiSelect } from "@/types/MultiSelectType";

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

type FormValues = z.infer<typeof formSchema>;

export const SignupForm = ({ seasonId }: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState("organization");
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const { season, isLoading, isError, isValidating } = useSeason(seasonId);
  const {
    organizations,
    isLoading: loadingOrgs,
    isError: isErrorOrg,
    isValidating: isValidatingOrgs
  } = useOrganizations();

  const {
    teams,
    isLoading: loadingTeams,
    isError: isErrorTeams,
    isValidating: isValidatingTeams
  } = useTeams();
  const { user, loading: loadingUser } = useAuth();
  const [validPlayers, setValidPlayers] = useState<
    Record<number, boolean | null>
  >({});

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

  const { control, setValue } = form;
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
  const prevWatchedSteamIds = useRef(steamIds);

  useEffect(() => {
    steamIds.forEach((steam_id, index) => {
      if (
        steam_id.length === 17 &&
        steam_id !== prevWatchedSteamIds.current[index] &&
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

            if (data.name && data.work_email) {
              setValidPlayers((prev) => ({ ...prev, [index]: true }));
            } else {
              setOpenItems((prev) => [...prev, `player-${index}`]);
              setValidPlayers((prev) => ({ ...prev, [index]: false }));
            }
          })
          .catch((error) => {
            console.error("Error fetching player data:", error);
            setValidPlayers((prev) => ({ ...prev, [index]: false }));
            setValue(`players.${index}.name`, "");
            setValue(`players.${index}.work_email`, "");
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
    loadingOrgs ||
    isValidatingOrgs ||
    loadingTeams ||
    isValidatingTeams ||
    loadingUser
  ) {
    return <TheContainer>Loading...</TheContainer>;
  }
  if (!user) {
    return <RequiresSteamLogin />;
  }

  if (
    isError ||
    isErrorOrg ||
    isErrorTeams ||
    !season ||
    !organizations ||
    !teams
  ) {
    return (
      <TheContainer>
        {isError?.message ?? isErrorOrg?.message ?? "Something went wrong..."}
      </TheContainer>
    );
  }

  const selectableOrganizations = organizations
    .map((org) => ({
      value: org.id,
      label: org.name,
      searchTerms: [org.organization_code?.toLowerCase() ?? ""]
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label)
    ) satisfies MultiSelect<number>[];

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

  const onNext = () => {
    if (activeTab === "organization") {
      setActiveTab("team");
    } else if (activeTab === "team") {
      setActiveTab("players");
    }
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

                <TabsContent value="organization">
                  <FormField
                    control={control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          <FancySelect<number>
                            isMulti={false}
                            allowOther={true}
                            filter={"organizations"}
                            selectable={selectableOrganizations ?? []}
                            placeholder="Search by name or business id"
                            currentSelection={
                              watchOrgId === -1
                                ? [{ value: -1, label: "Other" }]
                                : selectableOrganizations.filter(
                                    (org) => org.value === watchOrgId
                                  )
                            }
                            onSelectChange={(selectedItem) => {
                              if (!selectedItem) {
                                // Clear newTeam fields
                                form.reset({
                                  organizationId: undefined,
                                  newOrganization: undefined,
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
                            isOpen={openFilter === "organizations"}
                            setOpen={handleOpen}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Organization Input (Only if "Other" is selected) */}
                  {watchOrgId === -1 && (
                    <div className="pt-4 space-y-4">
                      <FormField
                        control={control}
                        name="newOrganization.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Insert organization name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="newOrganization.company_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Insert y-tunnus" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="newOrganization.website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Example: https://kanaliiga.fi/"
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
                    disabled={!validOrganizationSelection}
                    onClick={onNext}
                  >
                    Next
                  </Button>
                </TabsContent>
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
                    onClick={onNext}
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
                              validPlayers[index] === false
                                ? "border-red-500" // User not found
                                : validPlayers[index] === true
                                  ? "border-green-500" // User found
                                  : form.formState.errors.players?.[index]
                                      ?.steam_id && "border-red-500" // Normal validation
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
                                        field.onChange(e);
                                        if (e.target.value.length !== 17) {
                                          setValidPlayers((prev) => ({
                                            ...prev,
                                            [index]: null
                                          }));
                                        }
                                      }}
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
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TV-friendly nickname</FormLabel>
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

                            <FormField
                              control={control}
                              name={`players.${index}.work_email`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Work email</FormLabel>
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

                            <Button
                              variant="destructive"
                              onClick={() => {
                                setValidPlayers((prev) => {
                                  const newValidPlayers: Record<
                                    number,
                                    boolean | null
                                  > = {};

                                  Object.keys(prev)
                                    .map(Number) // Convert keys to numbers
                                    .filter((i) => i !== index) // Remove the deleted index
                                    .forEach((i) => {
                                      newValidPlayers[i < index ? i : i - 1] =
                                        prev[i] ?? null; // Shift indices down
                                    });

                                  return newValidPlayers;
                                });
                                remove(index);
                              }}
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
