"use client";
import { RequiresSteamLogin } from "@/components/layout/requires-steam-login";
import { TheContainer } from "@/components/layout/the-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import { useEffect, useMemo, useState } from "react";
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
import {
  SeasonPlatform,
  type FaceITTeamDetails,
  type SignupFormValues
} from "@eggosystem/types";
import { signupFormSchema, baseSignupFormSchema } from "@eggosystem/types";

interface SignupFormProps {
  seasonId: string;
  platform: SeasonPlatform;
}

const validateExternalPlaformId = async (
  platform: SeasonPlatform,
  externalId: string
) => {
  if (platform === SeasonPlatform.FACEIT) {
    const data = await apiFetch<FaceITTeamDetails>({
      url: `/faceit/teams/${externalId}`
    });
    return data;
  }
};

export const SignupForm = ({ seasonId, platform }: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState("organization");
  const { user, loading: loadingUser } = useAuth();
  const schema = signupFormSchema({ platform });
  const baseSchema = baseSignupFormSchema({ platform })._def.schema;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchingExternalData, setFetchingExternalData] = useState(false);
  const [validExternalTeamId, setValidExternalTeamId] = useState(
    platform !== SeasonPlatform.Kanaliiga ? null : true
  );

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
        account_id: 0,
        steam_id: "",
        nickname: "",
        discord: "",
        captain: false,
        co_captain: false,
        has_valid_data: undefined,
        is_profile_public: undefined,
        hours: undefined,
        rank: undefined,
        external_rank: undefined
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

  const { seasonDetails, isLoading, isError, isValidating } =
    useSeasonDetails(seasonId);

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

  useEffect(() => {
    const validateExternalId = async () => {
      if (
        validTeamExternalId.success &&
        validTeamExternalId.data.teamExternalId &&
        !fetchingExternalData &&
        !validExternalTeamId
      ) {
        setFetchingExternalData(true);
        const id = validTeamExternalId.data.teamExternalId;
        const data = await validateExternalPlaformId(platform, id);
        setValidExternalTeamId(!!data);
        setFetchingExternalData(false);
      }
      if (!validTeamExternalId.success) {
        setValidExternalTeamId(false);
      }
    };
    validateExternalId();
  }, [
    validTeamExternalId,
    platform,
    fetchingExternalData,
    validExternalTeamId
  ]);

  const onSubmit = async (data: SignupFormValues) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await apiFetch({
        url: `/seasons/${seasonId}/signup`,
        method: "POST",
        body: data
      });
      setSuccessMessage(
        "Team registered succesfully, please remember to pay participation fee."
      );
    } catch (_error) {
      setErrorMessage("Something went wrong... Please contact organizer.");
    }
  };

  if (isLoading || isValidating || loadingUser) {
    return <TheContainer classNames="w-full">Loading...</TheContainer>;
  }

  if (isError || !seasonDetails) {
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
    (validOrgId.success && validOrgId.data.organizationId !== -1) ||
      (validOrg.success &&
        validOrgId.data?.organizationId === -1 &&
        validOrg.data.newOrganization)
  );

  const validTeamSelection =
    Boolean(
      (validTeamId.success && validTeamId.data.teamId !== -1) ||
        (validTeam.success &&
          validTeamId.data?.teamId === -1 &&
          validTeam.data.newTeam)
    ) &&
    validTeamExternalId.success &&
    !!validExternalTeamId;

  const validPlayerSelection =
    validPlayers &&
    watchPlayers.every(
      (p) =>
        p.has_valid_data &&
        p.is_profile_public &&
        p.rank !== -1 &&
        p.external_rank !== -1 &&
        p.hours !== -1
    );

  const canSubmit =
    validOrganizationSelection && validTeamSelection && validPlayerSelection;

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
                  {validPlayerSelection && (
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
                platform={seasonDetails.platform}
                fetchingExternalData={fetchingExternalData}
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
                seasonSteamAppId={seasonDetails.app_id}
                platform={seasonDetails.platform}
                seasonId={seasonId}
              />
            </Tabs>

            <ErrorMessage
              errors={form.formState.errors}
              name="players.root"
              render={({ message }) => (
                <p className="text-destructive">{message}</p>
              )}
            />

            {successMessage && (
              <div className="text-green-500 font-semibold">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="text-red-500 font-semibold">{errorMessage}</div>
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={!!successMessage || !canSubmit}
            >
              Submit
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
