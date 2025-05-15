"use client";

import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { toast } from "sonner";
import { ApiError, clientApiFetch } from "@/lib/apiClient";
import {
  CREATE_NEW_VALUE,
  teamManualPlayerApprovalFormSchema,
  type ExistingTeamManualApprovalType,
  type NewTeamAndOrgManualApprovalType,
  type NewTeamManualApprovalType,
  type TeamManualPlayerApprovalFormSchemaType
} from "@eggosystem/types";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { PlusIcon } from "lucide-react";
import { NewOrganizationForm } from "@/components/organizations/new-organization-form";
import { useState } from "react";
import { CopyInput } from "@/components/inputs/copy-input";

export function TeamManualPlayerApprovalForm() {
  const methods = useForm<TeamManualPlayerApprovalFormSchemaType>({
    resolver: zodResolver(teamManualPlayerApprovalFormSchema),
    defaultValues: {
      acceptedPlayerSteamIds: []
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredTeamUrl, setRegisteredTeamUrl] = useState<string | null>(
    null
  );

  const { teams } = useSelectableTeams();
  const { organizations } = useSelectableOrgs();
  const selectedTeamId = methods.watch("teamId");
  const selectedOrgId = methods.watch("organizationId");

  const { fields, append, remove } =
    useFieldArray<TeamManualPlayerApprovalFormSchemaType>({
      control: methods.control,
      name: "acceptedPlayerSteamIds"
    });

  const onSubmit = async (data: TeamManualPlayerApprovalFormSchemaType) => {
    setErrorMessage(null);
    const steamIds = data.acceptedPlayerSteamIds.map((p) => p.name);

    const payload =
      data.teamId === CREATE_NEW_VALUE
        ? data.organizationId === CREATE_NEW_VALUE
          ? ({
              captainSteamId: data.captainSteamId,
              acceptedPlayerSteamIds: steamIds,
              newOrganizationName: data.organizationName!,
              newOrganizationCode: data.organizationCode!,
              newOrganizationWebsite: data.organizationWebsite!,
              newTeamName: data.newTeamName!,
              type: "new-team-and-org"
            } satisfies NewTeamAndOrgManualApprovalType)
          : ({
              captainSteamId: data.captainSteamId,
              acceptedPlayerSteamIds: steamIds,
              newTeamName: data.newTeamName!,
              organizationId: Number(data.organizationId),
              type: "new-team"
            } satisfies NewTeamManualApprovalType)
        : ({
            teamId: Number(data.teamId),
            captainSteamId: data.captainSteamId,
            acceptedPlayerSteamIds: steamIds,
            type: "existing"
          } satisfies ExistingTeamManualApprovalType);

    try {
      const data = await clientApiFetch<{ seasonId: number; teamId: number }>(
        "/api/v1/dashboard/registration/approved",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      setRegisteredTeamUrl(
        `${process.env.NEXT_PUBLIC_BASE_URL}/seasons/${data.seasonId}/signup/team/${data.teamId}/edit`
      );

      toast.success("Registration submitted successfully");
    } catch (error) {
      console.error(error);
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      toast.error("Something went wrong... Please contact developers.");
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6 max-w-md"
      >
        <div>
          <Label className="pb-1" htmlFor="teamId">
            Select Team or Create New
          </Label>
          <Select onValueChange={(value) => methods.setValue("teamId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CREATE_NEW_VALUE}>
                <PlusIcon /> Create New Team
              </SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={String(team.id)}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {methods.formState.errors.teamId && (
            <span className="text-red-500 text-sm mt-1">
              {methods.formState.errors.teamId.message}
            </span>
          )}
        </div>

        {selectedTeamId === CREATE_NEW_VALUE && (
          <>
            <div>
              <Label className="pb-1" htmlFor="organizationId">
                Select Organization or Create New
              </Label>
              <Select
                onValueChange={(value) =>
                  methods.setValue("organizationId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CREATE_NEW_VALUE}>
                    <PlusIcon /> Create New Organization
                  </SelectItem>
                  {organizations?.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {methods.formState.errors.organizationId && (
                <span className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.organizationId.message}
                </span>
              )}
            </div>

            {selectedOrgId === CREATE_NEW_VALUE && (
              <NewOrganizationForm
                control={methods.control}
                nameKey={"organizationName"}
                orgCodeKey={"organizationCode"}
                websiteKey={"organizationWebsite"}
              />
            )}

            <div>
              <Label className="pb-1" htmlFor="newTeamName">
                New Team Name
              </Label>
              <Input id="newTeamName" {...methods.register("newTeamName")} />
              {methods.formState.errors.newTeamName && (
                <span className="text-red-500 text-sm mt-1">
                  {methods.formState.errors.newTeamName.message}
                </span>
              )}
            </div>
          </>
        )}

        <div>
          <Label className="pb-1" htmlFor="captainSteamId">
            Captain Steam ID
          </Label>
          <Input id="captainSteamId" {...methods.register("captainSteamId")} />
          {methods.formState.errors.captainSteamId && (
            <span className="text-red-500 text-sm mt-1">
              {methods.formState.errors.captainSteamId.message}
            </span>
          )}
        </div>

        <div>
          {fields.map((field, index) => (
            <div key={field.id}>
              <Label className="pb-1">
                Accepted Player Steam ID #{index + 1}
              </Label>
              <Input
                {...methods.register(`acceptedPlayerSteamIds.${index}.name`)}
                placeholder="Steam ID"
              />
              {methods.formState.errors.acceptedPlayerSteamIds?.[index]
                ?.name && (
                <span className="text-red-500 text-sm mt-1">
                  {
                    methods.formState.errors.acceptedPlayerSteamIds[index]?.name
                      ?.message
                  }
                </span>
              )}
              <Button
                className="my-2"
                type="button"
                onClick={() => remove(index)}
                variant="secondary"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => append({ name: "" })}
            variant="outline"
          >
            <PlusIcon /> Add another player
          </Button>

          {methods.formState.errors.acceptedPlayerSteamIds && (
            <span className="text-red-500 text-sm mt-1">
              {
                methods.formState.errors.acceptedPlayerSteamIds
                  .message as string
              }
            </span>
          )}
        </div>

        <Button type="submit" disabled={methods.formState.isSubmitting}>
          {methods.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
        {errorMessage && (
          <div className="text-red-500 font-semibold">{errorMessage}</div>
        )}
        {registeredTeamUrl && (
          <div className="gap-2">
            Give this link to the captain to finish registration:
            <CopyInput value={registeredTeamUrl} />
          </div>
        )}
      </form>
    </FormProvider>
  );
}
