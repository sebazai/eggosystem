import { FancySelect } from "@/components/filters/fancy-multi-select";
import { Spinner } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
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
  fetchingExternalData: boolean;
}

const parseFaceITTeamId = (val: string) => {
  try {
    const parsedUrl = new URL(val);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    return segments.pop() || null;
  } catch (_error) {
    return val;
  }
};

export const TabTeam = ({
  watchTeamId,
  organizationId,
  control,
  resetField,
  validTeamSelection,
  onNext,
  platform,
  fetchingExternalData
}: TabTeamProps) => {
  const Platform = platform.charAt(0).toUpperCase() + platform.slice(1);
  const { teams, isLoading, isError, isValidating } =
    useOrganizationTeams(organizationId);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  if (isLoading) {
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
          <FormItem className="mb-2 sm:mb-4">
            <FormLabel>Team</FormLabel>
            <FormControl>
              <FancySelect<number>
                isMulti={false}
                allowOther={true}
                allowOtherText="Add new..."
                filter={"teams"}
                selectable={selectableTeams ?? []}
                isValidating={isValidating}
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

      {/* Custom Team Input (Only if "Other" is selected) */}
      {watchTeamId === -1 && (
        <div className="pt-2 space-y-4">
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

      {platform !== SeasonPlatform.Kanaliiga && (
        <FormField
          control={control}
          name="teamExternalId"
          render={({ field }) => (
            <FormItem className="pt-2">
              <FormLabel>{`Team ${Platform} id`}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const parsedValue = parseFaceITTeamId(inputValue);
                      field.onChange(parsedValue);
                    }}
                    placeholder={`Team ${Platform} id`}
                    className="pr-10"
                  />
                  {fetchingExternalData && (
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <Spinner />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-primary text-xs">
                https://www.faceit.com/fi/teams/ID
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <Button
        className="mt-2 w-full"
        disabled={!validTeamSelection}
        onClick={() => onNext("players")}
      >
        Go to lineup
      </Button>
    </TabsContent>
  );
};
