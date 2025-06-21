import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RequiredFormLabel } from "@/components/ui/RequiredFormLabel";
import type { Control, Path, FieldValues } from "react-hook-form";

interface NewOrganizationFormProps<T extends FieldValues> {
  control: Control<T>;
  nameKey: Path<T>;
  orgCodeKey: Path<T>;
  websiteKey: Path<T>;
}

export const NewOrganizationForm = <T extends FieldValues>({
  control,
  nameKey,
  orgCodeKey,
  websiteKey
}: NewOrganizationFormProps<T>) => {
  return (
    <div className="pt-4 space-y-4" data-testid="new-organization-fields">
      <FormField
        control={control}
        name={nameKey}
        render={({ field }) => (
          <FormItem>
            <RequiredFormLabel required>Organization name</RequiredFormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Insert organization name"
                data-testid="new-org-name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={orgCodeKey}
        render={({ field }) => (
          <FormItem>
            <RequiredFormLabel required>Business ID</RequiredFormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Insert y-tunnus (2992559-2)"
                data-testid="new-org-business-id"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={websiteKey}
        render={({ field }) => (
          <FormItem>
            <RequiredFormLabel required>Website</RequiredFormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Example: https://kanaliiga.fi/"
                data-testid="new-org-website"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
