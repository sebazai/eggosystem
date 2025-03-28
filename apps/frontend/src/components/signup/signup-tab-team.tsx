import { FancySelect } from "@/components/filters/fancy-multi-select";
import { Spinner } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { MultiSelect } from "@/types/MultiSelectType";
import { useState } from "react";
import type { Control, UseFormResetField } from "react-hook-form";
import { useOrganizationTeams } from "@/hooks/data/useOrganizationTeams";
import { SeasonPlatform, type SignupFormValues } from "@eggosystem/types";

interface TabTeamProps {
  watchTeamId: number;
  organizationId: number;
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  validTeamSelection: boolean;
  onNext: (value: string) => void;
  platform: string;
}

export const TabTeam = ({
  watchTeamId,
  organizationId,
  control,
  resetField,
  validTeamSelection,
  onNext,
  platform
}: TabTeamProps) => {
  const Platform = platform.charAt(0).toUpperCase() + platform.slice(1);
  const { teams, isLoading, isError, isValidating } =
    useOrganizationTeams(organizationId);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  if (isLoading || isValidating) {
    return <Spinner />;
  }
  if (isError || !teams) {
    return <div>Failed to load organizations</div>;
  }
  const selectableTeams = teams
    .map((team) => ({
      value: team.id,
      label: team.name
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label)
    ) satisfies MultiSelect<number>[];

  const handleOpen = (filter: string | null) => {
    if (filter === null) {
      setOpenFilter(null);
      return;
    }
    setOpenFilter((prev: string | null) => (prev === filter ? null : filter));
  };
  return (
    <TabsContent className="space-y-2" value="team">
      <FormField
        control={control}
        name="teamId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Team</FormLabel>
            <FormControl>
              <FancySelect<number>
                isMulti={false}
                allowOther={true}
                allowOtherText="Add new..."
                filter={"teams"}
                selectable={selectableTeams ?? []}
                placeholder="Select team"
                currentSelection={
                  watchTeamId === -1
                    ? [{ value: -1, label: "Other" }]
                    : selectableTeams.filter(
                        (team) => team.value === watchTeamId
                      )
                }
                onSelectChange={(selectedItem) => {
                  if (!selectedItem) {
                    resetField("teamId");
                    resetField("newTeam");
                  }
                  field.onChange(selectedItem?.value);
                }}
                isOpen={openFilter === "teams"}
                setOpen={handleOpen}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {platform !== SeasonPlatform.Kanaliiga && (
        <FormField
          control={control}
          name="teamExternalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{`Team ${Platform} id`}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={`Team ${Platform} id`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Custom Team Input (Only if "Other" is selected) */}
      {watchTeamId === -1 && (
        <div className="pt-4 space-y-4">
          <FormField
            control={control}
            name="newTeam.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Insert team name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      <Button
        className="mt-5 w-full"
        disabled={!validTeamSelection}
        onClick={() => onNext("players")}
      >
        Go to lineup
      </Button>
    </TabsContent>
  );
};
