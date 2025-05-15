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
  CREATE_NEW_TEAM_VALUE,
  teamManualPlayerApprovalFormSchema,
  type TeamManualPlayerApprovalFormSchemaType
} from "@eggosystem/types";
import { useSelectableTeams } from "@/hooks/data/dashboard/useSelectableTeams";

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
  const selectedTeamId = watch("teamId");

  const { fields, append, remove } =
    useFieldArray<TeamManualPlayerApprovalFormSchemaType>({
      control,
      name: "acceptedPlayerSteamIds"
    });

  const onSubmit = async (data: TeamManualPlayerApprovalFormSchemaType) => {
    const steamIds = data.acceptedPlayerSteamIds.map((p) => p.name);

    const payload =
      data.teamId === CREATE_NEW_TEAM_VALUE
        ? {
            captainSteamId: data.captainSteamId,
            acceptedPlayerSteamIds: steamIds,
            organizationName: data.organizationName,
            newTeamName: data.newTeamName
          }
        : {
            teamId: Number(data.teamId),
            captainSteamId: data.captainSteamId,
            acceptedPlayerSteamIds: steamIds
          };

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
            <SelectItem value={CREATE_NEW_TEAM_VALUE}>
              ➕ Create New Team
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

      {selectedTeamId === CREATE_NEW_TEAM_VALUE && (
        <>
          <div>
            <Label className="pb-1" htmlFor="organizationName">
              Organization Name
            </Label>
            <Input id="organizationName" {...register("organizationName")} />
            {errors.organizationName && (
              <span className="text-red-500 text-sm mt-1">
                {errors.organizationName.message}
              </span>
            )}
          </div>

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
          ➕ Add another player
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
  );
}
