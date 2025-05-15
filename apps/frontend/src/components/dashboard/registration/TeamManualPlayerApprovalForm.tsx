"use client";

import { useForm } from "react-hook-form";
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
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<TeamManualPlayerApprovalFormSchemaType>({
    resolver: zodResolver(teamManualPlayerApprovalFormSchema)
  });

  const { teams } = useSelectableTeams();

  const selectedTeamId = watch("teamId");

  const onSubmit = async (data: TeamManualPlayerApprovalFormSchemaType) => {
    const payload =
      data.teamId === CREATE_NEW_TEAM_VALUE
        ? {
            captainSteamId: data.captainSteamId,
            acceptedPlayerSteamId: data.acceptedPlayerSteamId,
            organizationName: data.organizationName,
            newTeamName: data.newTeamName
          }
        : {
            teamId: Number(data.teamId),
            captainSteamId: data.captainSteamId,
            acceptedPlayerSteamId: data.acceptedPlayerSteamId
          };

    try {
      await clientApiFetch("/api/v1/dashboard/registration/approved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      toast.success("Registration submitted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
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
          <p className="text-red-500 text-sm mt-1">{errors.teamId.message}</p>
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
              <p className="text-red-500 text-sm mt-1">
                {errors.organizationName.message}
              </p>
            )}
          </div>

          <div>
            <Label className="pb-1" htmlFor="newTeamName">
              New Team Name
            </Label>
            <Input id="newTeamName" {...register("newTeamName")} />
            {errors.newTeamName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.newTeamName.message}
              </p>
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
          <p className="text-red-500 text-sm mt-1">
            {errors.captainSteamId.message}
          </p>
        )}
      </div>

      <div>
        <Label className="pb-1" htmlFor="acceptedPlayerSteamId">
          Accepted Player Steam ID
        </Label>
        <Input
          id="acceptedPlayerSteamId"
          {...register("acceptedPlayerSteamId")}
        />
        {errors.acceptedPlayerSteamId && (
          <p className="text-red-500 text-sm mt-1">
            {errors.acceptedPlayerSteamId.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
