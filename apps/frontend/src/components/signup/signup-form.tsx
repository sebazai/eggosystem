"use client";
import { RequiresSteamLogin } from "@/components/layout/requires-steam-login";
import { TheContainer } from "@/components/layout/the-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useSeason } from "@/hooks/data/useSeason";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabOrganization } from "./signup-tab-organizations";
import { TabPlayers } from "./signup-tab-players";
import { TabTeam } from "./signup-tab-team";

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

export type SignupFormValues = z.infer<typeof formSchema>;
export type PlayerSchemaType = typeof playerSchema;

export const SignupForm = ({ seasonId }: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState("organization");
  const { user, loading: loadingUser } = useAuth();

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

  const { control, setValue, reset, watch } = form;

  const watchOrgId = useWatch({ control, name: "organizationId" });
  const watchNewOrg = useWatch({ control, name: "newOrganization" });
  const watchTeamId = useWatch({ control, name: "teamId" });
  const watchNewTeam = useWatch({ control, name: "newTeam" });

  const { season, isLoading, isError, isValidating } = useSeason(seasonId);

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

  const onSubmit = (data: SignupFormValues) => {
    console.log("Submitted:", data);
  };

  if (isLoading || isValidating || loadingUser) {
    return <TheContainer>Loading...</TheContainer>;
  }
  if (!user) {
    return <RequiresSteamLogin />;
  }

  if (isError || !season) {
    return (
      <TheContainer>
        {isError?.message ?? "Something went wrong..."}
      </TheContainer>
    );
  }

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
    <div className="min-w-xs sm:min-w-xl space-y-6">
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

                <TabTeam
                  organizationId={watchOrgId}
                  newOrganization={watchNewOrg}
                  control={control}
                  reset={reset}
                  onNext={onNext}
                  validTeamSelection={validTeamSelection}
                  watchTeamId={watchTeamId}
                />

                <TabPlayers
                  control={control}
                  playerSchema={playerSchema}
                  setValue={setValue}
                  watch={watch}
                />
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
