"use client";
import { RequiresSteamLogin } from "@/components/layout/RequiresSteamLogin";
import { ContentContainer } from "@/components/layout/ContentContainer";
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
import { TabOrganization } from "./TabOrganization";
import { TabPlayers } from "./TabPlayers";
import { TabTeam } from "./TabTeam";
import { ErrorMessage } from "@hookform/error-message";
import { CheckCheck } from "lucide-react";
import {
  cn,
  createBaseUrl,
  resolveSteamIdToSteamId64,
  isValidSteamId
} from "@/lib/utils";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import {
  SeasonPlatform,
  type FaceITTeamDetails,
  type SignupFormValues,
  type SignupPlayerType
} from "@eggosystem/types";
import { signupFormSchema, baseSignupFormSchema } from "@eggosystem/types";
import { CopyInput } from "@/components/inputs/CopyInput";
import { envConfig } from "@/configs/env";
import { Checkbox } from "../ui/checkbox";
import { RequiredFormLabel } from "../ui/RequiredFormLabel";
import { toast } from "sonner";

interface SignupFormProps {
  seasonId: string;
  platform: SeasonPlatform;
  draft?: SignupFormValues;
  editValues?: SignupFormValues;
  onDraftSaved?: () => void;
}

const validateExternalPlaformId = async (
  platform: SeasonPlatform,
  externalId: string
) => {
  if (platform === SeasonPlatform.FACEIT) {
    // Check extenralId is valid UUID
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        externalId
      )
    ) {
      return undefined;
    }
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
  captainHasReadTermAndConditions: false,
  players: Array(5).fill({
    accountId: 0,
    steamId: "",
    nickname: "",
    discord: "",
    captain: false,
    coCaptain: false,
    hasValidData: undefined,
    hasValidWorkEmail: undefined,
    isEmailVerified: undefined,
    hours: undefined,
    rank: undefined,
    externalRank: undefined
  } satisfies SignupPlayerType)
};

export const SignupForm = ({
  seasonId,
  platform,
  draft,
  editValues,
  onDraftSaved
}: SignupFormProps) => {
  const [activeTab, setActiveTab] = useState(
    editValues ? "players" : "organization"
  );
  const { user, loading: loadingUser } = useAuth();
  const schema = signupFormSchema({ platform });
  const baseSchema = baseSignupFormSchema({ platform });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchingExternalData, setFetchingExternalData] = useState(false);
  const [validExternalTeamId, setValidExternalTeamId] = useState(
    platform !== SeasonPlatform.Kanaliiga ? null : true
  );

  const isEditMode = !!editValues;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: editValues ?? draft ?? defaultValues,
    mode: "onTouched"
  });

  const prefilledPlayerSteamIds = useMemo(() => {
    if (editValues) {
      return editValues.players.map((p) => p.steamId);
    }
    if (draft) {
      return draft.players.map((p) => p.steamId);
    }
    return [];
  }, [editValues, draft]);

  const { control, setValue, resetField, watch, trigger } = form;

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
    validPlayers.success &&
    watchPlayers.every(
      (p) =>
        p.hasValidData &&
        p.hasValidWorkEmail &&
        p.isEmailVerified &&
        p.rank !== -1 &&
        (p.externalRank !== -1 ||
          seasonDetails?.platform === SeasonPlatform.Kanaliiga) &&
        p.hours !== -1
    );

  // Real-time captain/co-captain validation
  const validCaptainSelection = useMemo(() => {
    const captains = watchPlayers.filter((p) => p.captain === true);
    const coCaptains = watchPlayers.filter((p) => p.coCaptain === true);
    return captains.length === 1 && coCaptains.length === 1;
  }, [watchPlayers]);

  // Updated player selection validation that includes captain/co-captain check
  const validPlayerSelectionWithCaptains =
    validPlayerSelection && validCaptainSelection;

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
      // Convert all Steam IDs to SteamID64 format before submitting
      const convertedData = await convertSteamIdsToSteamId64(data);

      const returnValue = await clientApiFetch<{
        team_id: number;
        organization_id: number;
      }>(
        editValues
          ? `/api/v1/registrations/season/${seasonId}/signup/team/${editValues.teamId}`
          : `/api/v1/registrations/season/${seasonId}/signup`,
        {
          method: editValues ? "PUT" : "POST",
          body: JSON.stringify(convertedData)
        }
      );
      setSuccessMessage(`Team registered succesfully, please remember to`);
      toast.success(
        "Team registered successfully, please remember to pay participation fee."
      );
      setEditUrl(
        `${createBaseUrl()}/seasons/${seasonId}/signup/team/${returnValue.team_id}/edit`
      );

      // Refresh auth to get necessary permissions for edit link
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

  /**
   * Converts all Steam IDs in form data to SteamID64 format.
   * Uses local conversion for SteamID/SteamID3, API call for custom URLs.
   */
  const convertSteamIdsToSteamId64 = async (
    data: SignupFormValues
  ): Promise<SignupFormValues> => {
    const convertedPlayers = await Promise.all(
      data.players.map(async (player) => {
        // Skip empty Steam IDs
        if (!player.steamId || !player.steamId.trim()) {
          return player;
        }

        // If already SteamID64, return as-is
        if (isValidSteamId(player.steamId)) {
          return player;
        }

        // Try local conversion first (SteamID, SteamID3)
        const localConverted = await resolveSteamIdToSteamId64(player.steamId);
        if (localConverted) {
          return { ...player, steamId: localConverted };
        }

        // Try API resolution for custom URLs
        try {
          const response = await clientApiFetch<{ steamId64: string }>(
            `/api/v1/players/resolve/${encodeURIComponent(player.steamId.trim())}`
          );
          return { ...player, steamId: response.steamId64 };
        } catch (error) {
          // If resolution fails, keep original (validation will catch it)
          console.warn(
            `Failed to resolve Steam ID "${player.steamId}":`,
            error
          );
          return player;
        }
      })
    );

    return { ...data, players: convertedPlayers };
  };

  const saveAsDraft = async (formData: SignupFormValues) => {
    // Convert all Steam IDs to SteamID64 format before saving
    const convertedData = await convertSteamIdsToSteamId64(formData);

    const formDataStripped = {
      ...convertedData,
      players: convertedData.players.map((player) => ({
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
    setSuccessMessage("Saved draft for 30 days.");
    toast.success("Draft saved successfully", {
      description: "You can continue editing your draft later on this page."
    });

    // Invalidate the edit form data cache to ensure fresh data is loaded
    onDraftSaved?.();
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
    validPlayerSelectionWithCaptains &&
    hasAcceptedTermsAndConditions;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6 max-w-3xl">
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
                  {validPlayerSelectionWithCaptains && (
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
                trigger={trigger}
                playerErrorIndices={
                  form.formState.errors.players
                    ? Object.keys(form.formState.errors.players)
                    : []
                }
                seasonSteamAppId={seasonDetails.app_id}
                platform={seasonDetails.platform}
                seasonId={seasonId}
                validCaptainSelection={validCaptainSelection}
                prefilledPlayerSteamIds={prefilledPlayerSteamIds}
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
              <div data-testid="success-message">
                <div className="text-green-500 font-semibold py-2">
                  {successMessage}{" "}
                  {successMessage.includes("please remember to") && (
                    <Link
                      className="text-kanaliiga-orange hover:underline"
                      href="https://kanaliiga.fi/p/34437/osallistumismaksut/cskausimaksu_s4"
                    >
                      pay participation fee.
                    </Link>
                  )}
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
                      data-testid="terms-conditions-checkbox"
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

            {!isEditMode && (
              <div className="flex gap-2 w-full pt-5">
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
                <Button
                  type="button"
                  onClick={() => saveAsDraft(form.getValues())}
                  className="w-[50%]"
                  disabled={
                    form.formState.isSubmitting ||
                    form.formState.isSubmitSuccessful
                  }
                  data-testid="save-as-draft-button"
                >
                  Save as draft
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
