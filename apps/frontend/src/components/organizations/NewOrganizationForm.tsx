import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RequiredFormLabel } from "@/components/ui/RequiredFormLabel";
import { ImageUploadField } from "@/components/signup/ImageUploadField";
import type {
  Control,
  Path,
  FieldValues,
  UseFormSetValue
} from "react-hook-form";
import { useCallback } from "react";

interface NewOrganizationFormProps<T extends FieldValues> {
  control: Control<T>;
  nameKey: Path<T>;
  orgCodeKey: Path<T>;
  websiteKey: Path<T>;
  /** Optional: Key for image data (base64) */
  imageDataKey?: Path<T>;
  /** Optional: Key for image filename */
  imageFilenameKey?: Path<T>;
  /** Optional: setValue function for form (required if image keys are provided) */
  setValue?: UseFormSetValue<T>;
}

export const NewOrganizationForm = <T extends FieldValues>({
  control,
  nameKey,
  orgCodeKey,
  websiteKey,
  imageDataKey,
  imageFilenameKey,
  setValue
}: NewOrganizationFormProps<T>) => {
  const handleImageSelect = useCallback(
    (imageData: string | undefined, filename: string | undefined) => {
      if (setValue && imageDataKey && imageFilenameKey) {
        setValue(imageDataKey, imageData as T[keyof T]);
        setValue(imageFilenameKey, filename as T[keyof T]);
      }
    },
    [setValue, imageDataKey, imageFilenameKey]
  );

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
                data-testid="organization-name-input"
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
                data-testid="organization-business-id-input"
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
                data-testid="organization-website-input"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Optional Image Upload for Organization Logo */}
      {imageDataKey && imageFilenameKey && setValue && (
        <ImageUploadField
          id="organization-logo"
          label="Organization Logo (Optional)"
          onImageSelect={handleImageSelect}
          helpText="Upload a logo for your organization. Supported formats: PNG, JPG, GIF, WEBP. Max size: 10MB"
        />
      )}
    </div>
  );
};
