"use client";

import { useForm, useFieldArray } from "react-hook-form";
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
import { clientApiFetch } from "@/lib/apiClient";
import {
  CREATE_NEW_VALUE,
  teamManualPlayerApprovalFormSchema,
  type ExistingTeamManualApprovalType,
  type NewTeamAndOrgManualApprovalType,
  type NewTeamManualApprovalType,
  type TeamManualPlayerApprovalFormSchemaType
} from "@eggosystem/types";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";
import { Separator } from "@/components/ui/separator";
import { useSelectableOrgs } from "@/hooks/data/dashboard/useSelectableOrgs";
import { PlusIcon } from "lucide-react";

export function TeamManualPlayerApprovalForm() {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TeamManualPlayerApprovalFormSchemaType>({
    resolver: zodResolver(teamManualPlayerApprovalFormSchema),
    defaultValues: {
      acceptedPlayerSteamIds: []
    }
  });

  const { teams } = useSelectableTeams();
  const { organizations } = useSelectableOrgs();
  const selectedTeamId = watch("teamId");
  const selectedOrgId = watch("organizationId");

  const { fields, append, remove } =
    useFieldArray<TeamManualPlayerApprovalFormSchemaType>({
      control,
      name: "acceptedPlayerSteamIds"
    });

  const onSubmit = async (data: TeamManualPlayerApprovalFormSchemaType) => {
    const steamIds = data.acceptedPlayerSteamIds.map((p) => p.name);

    const payload =
      data.teamId === CREATE_NEW_VALUE
        ? data.organizationId === CREATE_NEW_VALUE
          ? ({
              captainSteamId: data.captainSteamId,
              acceptedPlayerSteamIds: steamIds,
              newOrganizationName: data.organizationName!,
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
      await clientApiFetch("/api/v1/dashboard/registration/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      toast.success("Registration submitted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <p>
        Use this form to pre-approve players that do not have e.g. a valid work
        e-mail, and is verified to be part of the organization/team in some
        other way.
      </p>
      <p>
        If the captain is the one requiring approval, set the Captain Steam ID,
        and add his Steam ID as an &quot;Accepted player&quot;
      </p>
      <Separator className="my-5 bg-kanaliiga-orange" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <div>
          <Label className="pb-1" htmlFor="teamId">
            Select Team or Create New
          </Label>
          <Select onValueChange={(value) => setValue("teamId", value)}>
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
          {errors.teamId && (
            <span className="text-red-500 text-sm mt-1">
              {errors.teamId.message}
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
                onValueChange={(value) => setValue("organizationId", value)}
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
              {errors.organizationId && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.organizationId.message}
                </span>
              )}
            </div>

            {selectedOrgId === CREATE_NEW_VALUE && (
              <div>
                <Label className="pb-1" htmlFor="organizationName">
                  Organization Name
                </Label>
                <Input
                  id="organizationName"
                  {...register("organizationName")}
                />
                {errors.organizationName && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.organizationName.message}
                  </span>
                )}
              </div>
            )}

            <div>
              <Label className="pb-1" htmlFor="newTeamName">
                New Team Name
              </Label>
              <Input id="newTeamName" {...register("newTeamName")} />
              {errors.newTeamName && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.newTeamName.message}
                </span>
              )}
            </div>
          </>
        )}

        <div>
          <Label className="pb-1" htmlFor="captainSteamId">
            Captain Steam ID
          </Label>
          <Input id="captainSteamId" {...register("captainSteamId")} />
          {errors.captainSteamId && (
            <span className="text-red-500 text-sm mt-1">
              {errors.captainSteamId.message}
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
                {...register(`acceptedPlayerSteamIds.${index}.name`)}
                placeholder="Steam ID"
              />
              {errors.acceptedPlayerSteamIds?.[index]?.name && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.acceptedPlayerSteamIds[index]?.name?.message}
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

          {errors.acceptedPlayerSteamIds && (
            <span className="text-red-500 text-sm mt-1">
              {errors.acceptedPlayerSteamIds.message as string}
            </span>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </>
  );
}
