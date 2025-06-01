import { FancySelect } from "@/components/filters/fancy-multi-select";
import { Spinner } from "@/components/icons";
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
import type { Control, UseFormSetValue } from "react-hook-form";
import { RequiredFormLabel } from "../ui/required-form-label";
import { NewOrganizationForm } from "../organizations/new-organization-form";

interface TabOrganizationProps {
  watchOrgId: number;
  control: Control<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  validOrganizationSelection: boolean;
  onNext: (value: string) => void;
  isEditMode: boolean;
}

export const TabOrganization = ({
  watchOrgId,
  control,
  setValue,
  validOrganizationSelection,
  onNext,
  isEditMode
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
                disabled={isEditMode}
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
                    // Clear newTeam fields
                    setValue("organizationId", -1);
                    setValue("newOrganization", {
                      name: "",
                      organization_code: "",
                      website: ""
                    });
                    setValue("teamId", -1);
                    setValue("newTeam", {
                      name: ""
                    });
                    setValue("teamExternalId", "");
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
        />
      )}
      <Button
        className="mt-5 w-full"
        disabled={!validOrganizationSelection}
        onClick={() => onNext("team")}
        data-testid="team-selection-button"
      >
        Team selection
      </Button>
    </TabsContent>
  );
};
