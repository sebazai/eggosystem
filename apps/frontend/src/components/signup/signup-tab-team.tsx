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
import { useEffect, useState } from "react";
import type { Control, UseFormResetField } from "react-hook-form";
import { useOrganizationTeams } from "@/hooks/data/useOrganizationTeams";
import { SeasonPlatform, type SignupFormValues } from "@eggosystem/types";
import { useTeamsWithoutOrgs } from "@/hooks/data/useTeamsWithoutOrgs";
import { ContentContainer } from "../layout/content-container";
import { Checkbox } from "../ui/checkbox";

interface TabTeamProps {
  watchTeamId: number;
  organizationId?: number;
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  validTeamSelection: boolean;
  onNext: (value: string) => void;
  platform: string;
  fetchingExternalData: boolean;
  isEditMode: boolean;
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
  fetchingExternalData,
  isEditMode
}: TabTeamProps) => {
  const [fetchTeamsWithoutOrg, setFetchTeamsWithoutOrg] = useState(false);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const platformText = platform.charAt(0).toUpperCase() + platform.slice(1);
  const { teams, isLoading, isError, isValidating } =
    useOrganizationTeams(organizationId);
  const {
    teamsWithoutOrgs,
    isLoading: isLoadingTeamsWithoutOrg,
    isValidating: isValidatingTeamsWithoutOrg
  } = useTeamsWithoutOrgs(fetchTeamsWithoutOrg);

  useEffect(() => {
    if (!fetchTeamsWithoutOrg && watchTeamId !== -1) {
      const team = teams?.find((team) => team.id === watchTeamId);
      if (!team) {
        resetField("teamId");
      }
    }
  }, [fetchTeamsWithoutOrg, resetField, teams, watchTeamId]);

  if (!organizationId) {
    return <></>;
  }
  if (isLoading) {
    return <Spinner />;
  }
  if (isError || !teams) {
    return (
      <ContentContainer>
        Failed to load teams for organization.
      </ContentContainer>
    );
  }
  const selectableTeams = teams
    .map((team) => ({
      value: team.id,
      label: team.name
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label)
    ) satisfies MultiSelect<number>[];

  const selectableTeamsWithoutOrgs = teamsWithoutOrgs
    ? (teamsWithoutOrgs
        .map((rogueTeam) => ({
          value: rogueTeam.id,
          label: rogueTeam.name
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label)
        ) satisfies MultiSelect<number>[])
    : [];

  const allSelectables = [...selectableTeams, ...selectableTeamsWithoutOrgs];
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
                disabled={isEditMode}
                isMulti={false}
                allowOther={true}
                allowOtherText="Add new..."
                filter={"teams"}
                selectable={allSelectables}
                isValidating={
                  isValidating ||
                  isValidatingTeamsWithoutOrg ||
                  isLoadingTeamsWithoutOrg
                }
                placeholder="Select team"
                currentSelection={
                  watchTeamId === -1
                    ? [{ value: -1, label: "Other" }]
                    : allSelectables.filter(
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="toggleTeamsWithoutOrg"
          checked={fetchTeamsWithoutOrg}
          onCheckedChange={(checked) => setFetchTeamsWithoutOrg(!!checked)}
        />
        <label
          htmlFor="toggleTeamsWithoutOrg"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show teams without an organization
        </label>
      </div>

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
              <FormLabel>{`Team ${platformText} id`}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      const parsedValue = parseFaceITTeamId(inputValue);
                      field.onChange(parsedValue);
                    }}
                    placeholder={`Team ${platformText} id`}
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
