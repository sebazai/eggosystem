"use client";
import { RequiresSteamLogin } from "@/components/layout/requires-steam-login";
import { ContentContainer } from "@/components/layout/content-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabOrganization } from "./signup-tab-organizations";
import { TabPlayers } from "./signup-tab-players";
import { TabTeam } from "./signup-tab-team";
import { ErrorMessage } from "@hookform/error-message";
import { CheckCheck } from "lucide-react";
import { cn, createBaseUrl } from "@/lib/utils";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import {
  SeasonPlatform,
  type FaceITTeamDetails,
  type SignupFormValues,
  type SignupPlayerType
} from "@eggosystem/types";
import { signupFormSchema, baseSignupFormSchema } from "@eggosystem/types";
import { CopyInput } from "@/components/inputs/copy-input";
import { envConfig } from "@/configs/env";
import { Checkbox } from "../ui/checkbox";
import { RequiredFormLabel } from "../ui/required-form-label";

interface SignupFormProps {
  seasonId: string;
  platform: SeasonPlatform;
  draft?: SignupFormValues;
  editValues?: SignupFormValues;
}

const validateExternalPlaformId = async (
  platform: SeasonPlatform,
  externalId: string
) => {
  if (platform === SeasonPlatform.FACEIT) {
    const data = await clientApiFetch<FaceITTeamDetails>(
      `/api/v1/faceit/teams/${externalId}`
    );
    return data;
  }
};

const defaultValues = {
  organizationId: undefined,
  teamId: undefined,
  newOrganization: undefined,
  newTeam: undefined,
  teamExternalId: "",
  players: Array(5).fill({
    accountId: 0,
    steamId: "",
    nickname: "",
    discord: "",
    captain: false,
    coCaptain: false,
    hasValidData: undefined,
    hasValidWorkEmail: undefined,
    isProfilePublic: undefined,
    hours: undefined,
    rank: undefined,
    externalRank: undefined
  } satisfies SignupPlayerType)
};

export const SignupForm = ({
  seasonId,
  platform,
  draft,
  editValues
}: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState(
    editValues ? "players" : "organization"
  );
  const { user, loading: loadingUser } = useAuth();
  const schema = signupFormSchema({ platform });
  const baseSchema = baseSignupFormSchema({ platform })._def.schema;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchingExternalData, setFetchingExternalData] = useState(false);
  const [validExternalTeamId, setValidExternalTeamId] = useState(
    platform !== SeasonPlatform.Kanaliiga ? null : true
  );

  const isEditMode = !!editValues;
  const isDraftMode = !!draft;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: editValues ?? draft ?? defaultValues
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
  const validTeamExternalIdInForm = useMemo(
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
        validTeamExternalIdInForm.success &&
        validTeamExternalIdInForm.data.teamExternalId &&
        !fetchingExternalData &&
        !validExternalTeamId
      ) {
        setFetchingExternalData(true);
        const id = validTeamExternalIdInForm.data.teamExternalId;
        const data = await validateExternalPlaformId(platform, id);
        setValidExternalTeamId(!!data);
        setFetchingExternalData(false);
      }
      if (!validTeamExternalIdInForm.success) {
        setValidExternalTeamId(false);
      }
    };
    validateExternalId();
  }, [
    validTeamExternalIdInForm,
    platform,
    fetchingExternalData,
    validExternalTeamId
  ]);

  const hasAcceptedTermsAndConditions = watch(
    "captainHasReadTermAndConditions"
  );

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
    validTeamExternalIdInForm.success &&
    !!validExternalTeamId;

  const validPlayerSelection =
    validPlayers &&
    watchPlayers.every(
      (p) =>
        p.hasValidData &&
        p.isProfilePublic &&
        (p.rank !== -1 || p.externalRank !== -1) &&
        p.hours !== -1
    );

  useEffect(() => {
    if (isEditMode && validTeamExternalIdInForm.success) {
      setActiveTab("players");
    }
    if (isEditMode && !validTeamExternalIdInForm.success) {
      setActiveTab("team");
    }
  }, [isEditMode, validTeamExternalIdInForm.success]);

  const onSubmit = async (data: SignupFormValues) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const returnValue = await clientApiFetch<{
        team_id: number;
        organization_id: number;
      }>(
        editValues
          ? `/api/v1/registrations/season/${seasonId}/signup/team/${editValues.teamId}`
          : `/api/v1/registrations/season/${seasonId}/signup`,
        {
          method: editValues ? "PUT" : "POST",
          body: JSON.stringify(data)
        }
      );
      setSuccessMessage(
        isEditMode
          ? "Team edited successfully"
          : "Team registered succesfully, please remember to pay participation fee."
      );
      setEditUrl(
        `${createBaseUrl()}/seasons/${seasonId}/signup/team/${returnValue.team_id}/edit`
      );
      await fetch(`${envConfig.CLIENT_API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage("Something went wrong... Please contact organizer.");
    }
  };

  const saveAsDraft = async (formData: SignupFormValues) => {
    const formDataStripped = {
      ...formData,
      players: formData.players.map((player) => ({
        accountId: player.accountId,
        steamId: player.steamId,
        nickname: player.nickname,
        captain: player.captain,
        coCaptain: player.coCaptain
      }))
    } satisfies SignupFormValues;
    await clientApiFetch(`/api/v1/registrations/season/${seasonId}/draft`, {
      method: "POST",
      body: JSON.stringify(formDataStripped)
    });
    setSuccessMessage("Saved draft for 7 days.");
  };

  if (!user) {
    return <RequiresSteamLogin />;
  }

  if (isLoading || isValidating || loadingUser) {
    return <ContentContainer classNames="w-full">Loading...</ContentContainer>;
  }

  if (isError || !seasonDetails) {
    return (
      <ContentContainer>
        {isError?.message ?? "Something went wrong..."}
      </ContentContainer>
    );
  }

  const onNext = (value: string) => {
    setActiveTab(value);
  };

  const canSubmit =
    validOrganizationSelection &&
    validTeamSelection &&
    validPlayerSelection &&
    hasAcceptedTermsAndConditions;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">
              {isEditMode ? "Edit signup" : "Sign up Form"}
            </h2>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-2 md:space-y-6"
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
                isEditMode={isEditMode}
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
                isEditMode={isEditMode}
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
                isEditMode={isEditMode}
                isDraft={isDraftMode}
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
              <div>
                <div className="text-green-500 font-semibold py-2">
                  {successMessage}
                </div>
                {editUrl && (
                  <div className="gap-2">
                    Captains edit link:
                    <CopyInput value={editUrl} />
                  </div>
                )}
              </div>
            )}
            {errorMessage && (
              <div className="text-red-500 font-semibold">{errorMessage}</div>
            )}

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={
                form.formState.isSubmitting ||
                form.formState.isSubmitSuccessful ||
                !canSubmit
              }
            >
              Submit
            </Button>

            <FormField
              control={control}
              name={"captainHasReadTermAndConditions"}
              render={({ field }) => (
                <FormItem className="flex items-center gap-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        setValue(
                          "captainHasReadTermAndConditions",
                          Boolean(checked)
                        )
                      }
                    />
                  </FormControl>
                  <RequiredFormLabel className="flex flex-wrap items-center gap-2">
                    I have read and understood the
                    <Link
                      className="text-kanaliiga-orange hover:underline whitespace-nowrap"
                      href={"https://wiki.kanaliiga.fi/CS2/Registration"}
                      target="_blank"
                    >
                      terms and conditions
                    </Link>
                  </RequiredFormLabel>
                </FormItem>
              )}
            />

            <div className="flex gap-2 w-full pt-5">
              <Button
                type="button"
                onClick={() => saveAsDraft(form.getValues())}
                variant="secondary"
                className="w-[50%]"
                disabled={
                  form.formState.isSubmitting ||
                  form.formState.isSubmitSuccessful
                }
              >
                Save as draft
              </Button>
              <Button
                type="reset"
                onClick={() => {
                  setActiveTab("organization");
                  form.reset(defaultValues);
                }}
                variant="destructive"
                className="w-[50%]"
                disabled={
                  form.formState.isSubmitting ||
                  form.formState.isSubmitSuccessful
                }
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
