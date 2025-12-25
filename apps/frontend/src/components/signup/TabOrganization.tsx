import { FancySelect } from "@/components/filters/FancyMultiSelect";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { TabsContent } from "@/components/ui/tabs";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import type { MultiSelect } from "@/types/MultiSelectType";
import type { SignupFormValues } from "@eggosystem/types";
import { useState } from "react";
import type {
  Control,
  UseFormResetField,
  UseFormSetValue,
  UseFormWatch
} from "react-hook-form";
import { RequiredFormLabel } from "../ui/RequiredFormLabel";
import { NewOrganizationForm } from "../organizations/NewOrganizationForm";

interface TabOrganizationProps {
  watchOrgId: number;
  control: Control<SignupFormValues>;
  resetField: UseFormResetField<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  watch: UseFormWatch<SignupFormValues>;
  validOrganizationSelection: boolean;
  onNext: (value: string) => void;
  isEditMode: boolean;
  submitInitiated: boolean;
  isCreatingOrg: boolean;
}

export const TabOrganization = ({
  watchOrgId,
  control,
  resetField,
  setValue,
  watch,
  validOrganizationSelection,
  onNext,
  isEditMode,
  submitInitiated,
  isCreatingOrg
}: TabOrganizationProps) => {
  const {
    organizations,
    isLoading: loadingOrgs,
    isError: isErrorOrg,
    isValidating: isValidatingOrgs
  } = useOrganizations();
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  if (loadingOrgs || isValidatingOrgs) {
    return <Spinner />;
  }
  if (isErrorOrg || !organizations) {
    return <div>Failed to load organizations</div>;
  }
  const selectableOrganizations = organizations
    .map((org) => ({
      value: org.id,
      label: org.name,
      searchTerms: [org.organization_code?.toLowerCase() ?? ""]
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

  const handleTeamSelectionClick = () => {
    // Just proceed to next tab - organization creation is handled in onNext
    onNext("team");
  };
  return (
    <TabsContent value="organization">
      <FormField
        control={control}
        name="organizationId"
        render={({ field }) => (
          <FormItem>
            <RequiredFormLabel required>Organization</RequiredFormLabel>
            <FormControl>
              <FancySelect<number>
                disabled={isEditMode || submitInitiated}
                isMulti={false}
                allowOther={true}
                allowOtherText="Add new..."
                filter={"organizations"}
                selectable={selectableOrganizations ?? []}
                isValidating={isValidatingOrgs}
                placeholder="Name or Business ID..."
                currentSelection={
                  watchOrgId === -1
                    ? [{ value: -1, label: "Other" }]
                    : selectableOrganizations.filter(
                        (org) => org.value === watchOrgId
                      )
                }
                onSelectChange={(selectedItem) => {
                  if (!selectedItem) {
                    resetField("organizationId");
                    resetField("newOrganization");
                    resetField("teamId");
                    resetField("newTeam");
                    resetField("teamExternalId");
                  }
                  field.onChange(selectedItem?.value);
                }}
                isOpen={openFilter === "organizations"}
                setOpen={handleOpen}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Custom Organization Input (Only if "Other" is selected) */}
      {watchOrgId === -1 && (
        <NewOrganizationForm
          control={control}
          nameKey={"newOrganization.name"}
          orgCodeKey={"newOrganization.organization_code"}
          websiteKey={"newOrganization.website"}
          imageDataKey={"newOrganization.image_data"}
          imageFilenameKey={"newOrganization.image_filename"}
          watch={watch}
          setValue={setValue}
        />
      )}
      <Button
        className="mt-5 w-full"
        disabled={!validOrganizationSelection || isCreatingOrg}
        onClick={handleTeamSelectionClick}
        data-testid="team-selection-button"
      >
        {isCreatingOrg
          ? "Creating organization..."
          : watchOrgId === -1
            ? "Create organization & continue to team"
            : "Continue to team selection"}
      </Button>
    </TabsContent>
  );
};
