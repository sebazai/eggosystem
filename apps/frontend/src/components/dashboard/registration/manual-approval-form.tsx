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
  manualPlayerApprovalFormSchema,
  type ExistingTeamManualApprovalType,
  type NewTeamAndOrgManualApprovalType,
  type NewTeamManualApprovalType,
  type ManualPlayerApprovalFormSchemaType
} from "@eggosystem/types";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { PlusIcon } from "lucide-react";
import { NewOrganizationForm } from "@/components/organizations/new-organization-form";
import { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

export function ManualPlayerApprovalForm() {
  const methods = useForm<ManualPlayerApprovalFormSchemaType>({
    resolver: zodResolver(manualPlayerApprovalFormSchema),
    defaultValues: {
      acceptedPlayerSteamIds: [],
      organizationId: undefined,
      teamId: undefined,
      newTeamName: undefined,
      organizationCode: undefined,
      organizationName: undefined,
      organizationWebsite: undefined
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTeamId = methods.watch("teamId");
  const selectedOrgId = methods.watch("organizationId");
  const { organizations } = useSelectableOrgs(selectedTeamId);
  const { teams } = useSelectableTeams(selectedOrgId);

  const { fields, append, remove } =
    useFieldArray<ManualPlayerApprovalFormSchemaType>({
      control: methods.control,
      name: "acceptedPlayerSteamIds"
    });

  const onSubmit = async (data: ManualPlayerApprovalFormSchemaType) => {
    setErrorMessage(null);
    const steamIds = data.acceptedPlayerSteamIds.map((p) => p.name);

    const payload =
      data.teamId === CREATE_NEW_VALUE
        ? data.organizationId === CREATE_NEW_VALUE
          ? ({
              acceptedPlayerSteamIds: steamIds,
              newOrganizationName: data.organizationName!,
              newOrganizationCode: data.organizationCode!,
              newOrganizationWebsite: data.organizationWebsite!,
              newTeamName: data.newTeamName!,
              type: "new-team-and-org"
            } satisfies NewTeamAndOrgManualApprovalType)
          : ({
              acceptedPlayerSteamIds: steamIds,
              newTeamName: data.newTeamName!,
              organizationId: data.organizationId
                ? Number(data.organizationId)
                : undefined,
              type: "new-team"
            } satisfies NewTeamManualApprovalType)
        : ({
            teamId: Number(data.teamId),
            acceptedPlayerSteamIds: steamIds,
            type: "existing"
          } satisfies ExistingTeamManualApprovalType);

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
                    <SelectTrigger value={field.value ?? undefined}>
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
              name={`acceptedPlayerSteamIds.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <Label className="pb-1">
                    Accepted Player Steam ID #{index + 1}
                  </Label>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Insert player steamid"
                      data-testid={`player-steam-id-${index}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              onClick={() => remove(index)}
              variant="secondary"
              className="self-end"
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
                <Input {...field} placeholder="Insert optional ticket id" />
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
                <Textarea {...field} placeholder="Insert optional details" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={methods.formState.isSubmitting}>
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
