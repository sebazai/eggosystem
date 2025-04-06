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
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabOrganization } from "./signup-tab-organizations";
import { TabPlayers } from "./signup-tab-players";
import { TabTeam } from "./signup-tab-team";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ErrorMessage } from "@hookform/error-message";
import { apiFetch } from "@/lib/apiClient";
import { SeasonPlatform, type SignupFormValues } from "@eggosystem/types";
import { signupFormSchema, baseSignupFormSchema } from "@eggosystem/types";

interface SignupFormProps {
  seasonId: string;
  platform: SeasonPlatform;
}

export const SignupForm = ({ seasonId, platform }: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState("organization");
  const { user, loading: loadingUser } = useAuth();
  const schema = signupFormSchema({ platform });
  const baseSchema = baseSignupFormSchema({ platform })._def.schema;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationId: undefined,
      teamId: undefined,
      newOrganization: {
        name: "",
        organization_code: "",
        website: ""
      },
      newTeam: {
        name: ""
      },
      teamExternalId: "",
      players: Array(5).fill({
        steam_id: "",
        name: "",
        discord: "",
        captain: false,
        co_captain: false
      }),
      defects: ""
    }
  });

  const { control, setValue, resetField, watch } = form;

  const watchOrgId = useWatch({ control, name: "organizationId" });
  const watchNewOrg = useWatch({ control, name: "newOrganization" });
  const watchTeamId = useWatch({ control, name: "teamId" });
  const watchExternalTeamId = useWatch({ control, name: "teamExternalId" });
  const watchNewTeam = useWatch({ control, name: "newTeam" });
  const watchPlayers = useWatch({ control, name: "players" });

  const { season, isLoading, isError, isValidating } = useSeason(seasonId);

  const validOrgId = useMemo(
    () =>
      baseSchema
        .pick({
          organizationId: true
        })
        .safeParse({ organizationId: watchOrgId }),

    [watchOrgId, baseSchema]
  );
  const validOrg = useMemo(
    () =>
      baseSchema
        .pick({
          newOrganization: true
        })
        .safeParse({ newOrganization: watchNewOrg }),
    [watchNewOrg, baseSchema]
  );
  const validTeamId = useMemo(
    () =>
      baseSchema
        .pick({
          teamId: true
        })
        .safeParse({ teamId: watchTeamId }),
    [watchTeamId, baseSchema]
  );
  const validTeam = useMemo(
    () =>
      baseSchema
        .pick({
          newTeam: true
        })
        .safeParse({ newTeam: watchNewTeam }),
    [watchNewTeam, baseSchema]
  );
  const validTeamExternalId = useMemo(
    () =>
      baseSchema
        .pick({ teamExternalId: true })
        .safeParse({ teamExternalId: watchExternalTeamId }),
    [watchExternalTeamId, baseSchema]
  );
  const validPlayers = useMemo(
    () =>
      baseSchema
        .pick({
          players: true
        })
        .safeParse({ players: watchPlayers }),
    [watchPlayers, baseSchema]
  );

  const onSubmit = async (data: SignupFormValues) => {
    await apiFetch({
      url: `/seasons/${seasonId}/signup`,
      method: "POST",
      body: data
    });
  };

  if (isLoading || isValidating || loadingUser) {
    return <TheContainer classNames="w-full">Loading...</TheContainer>;
  }

  if (isError || !season) {
    return (
      <TheContainer>
        {isError?.message ?? "Something went wrong..."}
      </TheContainer>
    );
  }

  if (!user) {
    return <RequiresSteamLogin />;
  }

  const onNext = (value: string) => {
    setActiveTab(value);
  };

  const validOrganizationSelection = Boolean(
    (validOrgId.success !== false && validOrgId.data.organizationId !== -1) ||
      (validOrg.success !== false &&
        validOrgId.data?.organizationId === -1 &&
        validOrg.data.newOrganization)
  );

  const validTeamSelection =
    Boolean(
      (validTeamId.success !== false && validTeamId.data.teamId !== -1) ||
        (validTeam.success !== false &&
          validTeamId.data?.teamId === -1 &&
          validTeam.data.newTeam)
    ) &&
    (platform === SeasonPlatform.Kanaliiga || validTeamExternalId.success);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">Sign up Form</h2>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 h-full w-full">
                <TabsTrigger
                  value="organization"
                  className="w-full sm:w-auto border border-transparent hover:bg-gray-200 rounded-md transition"
                >
                  Organization{" "}
                  {validOrganizationSelection && (
                    <CheckCheck
                      className={cn(
                        validOrganizationSelection && "text-green-500"
                      )}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="w-full sm:w-auto border border-transparent hover:bg-gray-200 rounded-md transition"
                  disabled={!validOrganizationSelection}
                >
                  Team{" "}
                  {validTeamSelection && (
                    <CheckCheck
                      className={cn(
                        validOrganizationSelection && "text-green-500"
                      )}
                    />
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="players"
                  className="w-full sm:w-auto border border-transparent hover:bg-gray-200 rounded-md transition"
                  disabled={!validTeamSelection}
                >
                  Players{" "}
                  {validPlayers.success && (
                    <CheckCheck
                      className={cn(
                        validOrganizationSelection && "text-green-500"
                      )}
                    />
                  )}
                </TabsTrigger>
              </TabsList>

              <TabOrganization
                control={control}
                resetField={resetField}
                onNext={onNext}
                validOrganizationSelection={validOrganizationSelection}
                watchOrgId={watchOrgId}
              />

              <TabTeam
                organizationId={watchOrgId}
                control={control}
                resetField={resetField}
                onNext={onNext}
                validTeamSelection={validTeamSelection}
                watchTeamId={watchTeamId}
                platform={season.platform}
              />

              <TabPlayers
                control={control}
                resetField={resetField}
                setValue={setValue}
                watch={watch}
                playerErrorIndices={
                  form.formState.errors.players
                    ? Object.keys(form.formState.errors.players)
                    : []
                }
              />
            </Tabs>

            <ErrorMessage
              errors={form.formState.errors}
              name="players.root"
              render={({ message }) => (
                <p className="text-destructive">{message}</p>
              )}
            />

            <Button type="submit" variant="outline" className="w-full">
              Submit
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
