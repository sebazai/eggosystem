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
import { useOrganizations } from "@/hooks/data/useOrganizations";
import type { MultiSelect } from "@/types/MultiSelectType";
import { useState } from "react";
import type { Control, UseFormReset } from "react-hook-form";
import type { SignupFormValues } from "./signup-form";

interface TabOrganizationProps {
  watchOrgId: number;
  control: Control<SignupFormValues>;
  reset: UseFormReset<SignupFormValues>;
  validOrganizationSelection: boolean;
  onNext: (value: string) => void;
}

export const TabOrganization = ({
  watchOrgId,
  control,
  reset,
  validOrganizationSelection,
  onNext
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
            <FormLabel>Organization</FormLabel>
            <FormControl>
              <FancySelect<number>
                isMulti={false}
                allowOther={true}
                filter={"organizations"}
                selectable={selectableOrganizations ?? []}
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
                    reset({
                      organizationId: undefined,
                      newOrganization: undefined,
                      teamId: undefined,
                      newTeam: undefined,
                      players: Array(5).fill({
                        steam_id: "",
                        name: "",
                        work_email: ""
                      })
                    });
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
        <div className="pt-4 space-y-4">
          <FormField
            control={control}
            name="newOrganization.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Insert organization name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="newOrganization.company_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Insert y-tunnus" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="newOrganization.website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Example: https://kanaliiga.fi/"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      <Button
        className="mt-5 w-full"
        disabled={!validOrganizationSelection}
        onClick={() => onNext("team")}
      >
        Team selection
      </Button>
    </TabsContent>
  );
};
