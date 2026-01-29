"use client";

import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SteamIdInput } from "@/components/ui/steam-id-input";
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
  manualPlayerApprovalFormSchema,
  type ExistingTeamManualApprovalType,
  type NewTeamAndOrgManualApprovalType,
  type NewTeamManualApprovalType,
  type NewOrgManualApprovalType,
  type ManualPlayerApprovalFormSchemaType,
  type ExistingOrgManualApprovalType
} from "@eggosystem/types";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, PlusIcon } from "lucide-react";
import { NewOrganizationForm } from "@/components/organizations/NewOrganizationForm";
import { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { usePlayerFullName } from "@/hooks/data/dashboard/usePlayerFullName";
import type { FieldValues } from "react-hook-form";

const generatePayload = (
  data: ManualPlayerApprovalFormSchemaType,
  seasonId: number
) => {
  const steamIds = data.acceptedPlayerSteamIds.map((p) => p.steamId);

  // New team and new org
  if (data.teamId === CREATE_NEW_VALUE) {
    if (data.organizationId === CREATE_NEW_VALUE) {
      return {
        acceptedPlayerSteamIds: steamIds,
        newOrganizationName: data.organizationName!,
        newOrganizationCode: data.organizationCode!,
        newOrganizationWebsite: data.organizationWebsite!,
        newTeamName: data.newTeamName!,
        ticketId: data.ticketId,
        details: data.details,
        season_id: seasonId,
        type: "new-team-and-org"
      } satisfies NewTeamAndOrgManualApprovalType;
    }
  }

  // If new org, we do not care about team...
  if (data.organizationId === CREATE_NEW_VALUE) {
    return {
      acceptedPlayerSteamIds: steamIds,
      newOrganizationName: data.organizationName!,
      newOrganizationCode: data.organizationCode!,
      newOrganizationWebsite: data.organizationWebsite!,
      ticketId: data.ticketId,
      details: data.details,
      season_id: seasonId,
      type: "new-org"
    } satisfies NewOrgManualApprovalType;
  }

  if (data.teamId === CREATE_NEW_VALUE) {
    return {
      acceptedPlayerSteamIds: steamIds,
      newTeamName: data.newTeamName!,
      ticketId: data.ticketId,
      details: data.details,
      season_id: seasonId,
      type: "new-team"
    } satisfies NewTeamManualApprovalType;
  }

  if (data.organizationId) {
    return {
      acceptedPlayerSteamIds: steamIds,
      organizationId: Number(data.organizationId),
      ticketId: data.ticketId,
      details: data.details,
      season_id: seasonId,
      type: "existing-org"
    } satisfies ExistingOrgManualApprovalType;
  }

  if (data.teamId) {
    return {
      teamId: Number(data.teamId),
      acceptedPlayerSteamIds: steamIds,
      ticketId: data.ticketId,
      details: data.details,
      season_id: seasonId,
      type: "existing-team"
    } satisfies ExistingTeamManualApprovalType;
  }

  throw new Error("Invalid form data");
};

function SteamIdInputWithName({
  field,
  index
}: {
  field: FieldValues;
  index: number;
}) {
  const steamId = field.value;
  const { fullName, loading, error } = usePlayerFullName(steamId);

  return (
    <FormItem>
      <Label className="pb-1">Accepted Player Steam ID #{index + 1}</Label>
      <FormControl>
        <SteamIdInput
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          placeholder="Insert player steamid"
          convertOnBlur={true}
          data-testid={`player-steam-id-${index}`}
        />
      </FormControl>
      {steamId && steamId.length === 17 && (
        <div className="text-xs text-muted-foreground mt-1 min-h-[1.25rem]">
          {loading && "Loading name..."}
          {!loading && error && <span className="text-red-500">Not found</span>}
          {!loading && !error && fullName && <span>{fullName}</span>}
          {!loading && !error && !fullName && <span>No name found</span>}
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
}

export function ManualPlayerApprovalForm() {
  const { selectedSeasonId } = useDashboardSeason();
  const methods = useForm({
    resolver: zodResolver(manualPlayerApprovalFormSchema),
    defaultValues: {
      acceptedPlayerSteamIds: [],
      organizationId: undefined,
      teamId: undefined,
      newTeamName: undefined,
      organizationCode: undefined,
      organizationName: undefined,
      organizationWebsite: undefined,
      ticketId: "",
      details: undefined
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTeamId = methods.watch("teamId");
  const selectedOrgId = methods.watch("organizationId");
  const { organizations } = useSelectableOrgs(selectedTeamId);
  const { teams } = useSelectableTeams(selectedOrgId);

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "acceptedPlayerSteamIds"
  });

  const onSubmit = async (data: ManualPlayerApprovalFormSchemaType) => {
    setErrorMessage(null);

    if (!selectedSeasonId) {
      setErrorMessage("Please select a season from the sidebar");
      return;
    }

    const payload = generatePayload(data, Number(selectedSeasonId));

    try {
      await clientApiFetch<{ seasonId: number; teamId: number }>(
        "/api/v1/dashboard/registration/approved",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      toast.success("Registration submitted successfully");
      methods.reset();
    } catch (error) {
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
        {!selectedSeasonId && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select a season from the sidebar to submit player
              approvals.
            </AlertDescription>
          </Alert>
        )}

        {selectedSeasonId && (
          <div className="space-y-2">
            <Label>Season</Label>
            <SelectedSeasonBadge />
          </div>
        )}

        <FormField
          control={methods.control}
          name={"organizationId"}
          render={({ field }) => {
            return (
              <FormItem>
                <Label className="pb-1" htmlFor="organizationId">
                  Select Organization or Create New
                </Label>
                <FormControl>
                  <Select
                    key={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    value={field.value || ""}
                  >
                    <SelectTrigger
                      value={field.value ?? undefined}
                      data-testid="manual-approval-organization-trigger"
                    >
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
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {selectedOrgId === CREATE_NEW_VALUE && (
          <NewOrganizationForm
            control={methods.control}
            nameKey={"organizationName"}
            orgCodeKey={"organizationCode"}
            websiteKey={"organizationWebsite"}
          />
        )}

        <FormField
          control={methods.control}
          name={"teamId"}
          render={({ field }) => {
            return (
              <FormItem>
                <Label className="pb-1" htmlFor="teamId">
                  Select Team or Create New
                </Label>
                <FormControl>
                  <Select
                    key={field.value}
                    onValueChange={field.onChange}
                    value={field.value ?? undefined}
                  >
                    <SelectTrigger value={field.value ?? undefined}>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {selectedTeamId === CREATE_NEW_VALUE && (
          <FormField
            control={methods.control}
            name={"newTeamName"}
            render={({ field }) => (
              <FormItem>
                <Label className="pb-1" htmlFor="newTeamName">
                  New Team Name
                </Label>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Insert team name"
                    data-testid="team-name-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {fields.map((field, index) => (
          <div className="flex gap-2" key={field.id}>
            <FormField
              control={methods.control}
              name={`acceptedPlayerSteamIds.${index}.steamId`}
              render={({ field }) => (
                <SteamIdInputWithName field={field} index={index} />
              )}
            />
            <Button
              type="button"
              onClick={() => remove(index)}
              variant="secondary"
              className="self-center"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() => append({ steamId: "" })}
          variant="outline"
          data-testid="manual-approval-add-player"
        >
          <PlusIcon /> Add player
        </Button>

        <FormField
          control={methods.control}
          name={"ticketId"}
          render={({ field }) => (
            <FormItem>
              <Label className="pb-1" htmlFor="ticketId">
                Ticket Number
              </Label>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Insert optional ticket id"
                  data-testid="ticket-id-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={methods.control}
          name={"details"}
          render={({ field }) => (
            <FormItem>
              <Label className="pb-1" htmlFor="details">
                Details
              </Label>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Insert optional details"
                  data-testid="details-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={methods.formState.isSubmitting || !selectedSeasonId}
            data-testid="manual-approval-submit"
          >
            {methods.formState.isSubmitting ? "Submitting..." : "Submit"}
          </Button>
          <Button
            type="reset"
            variant="destructive"
            onClick={() => methods.reset()}
          >
            Reset
          </Button>
        </div>
        {errorMessage && (
          <div className="text-red-500 font-semibold">{errorMessage}</div>
        )}
      </form>
    </FormProvider>
  );
}
