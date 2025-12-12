"use client";

import { useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";

interface ImageUploadFieldProps {
  /** Current image URL (for preview) or base64 data */
  currentImageUrl?: string;
  /** Callback when image is selected - receives base64 data and filename */
  onImageSelect: (
    imageData: string | undefined,
    filename: string | undefined
  ) => void;
  /** Label for the field */
  label?: string;
  /** ID for the input element */
  id: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Helper text */
  helpText?: string;
}

/**
 * A reusable image upload field component for signup forms.
 * Handles file selection, validation, and preview.
 */
export function ImageUploadField({
  currentImageUrl,
  onImageSelect,
  label = "Logo (Optional)",
  id,
  disabled = false,
  helpText = "Supported formats: PNG, JPG, GIF, WEBP. Max size: 10MB"
}: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        setPreview(null);
        onImageSelect(undefined, undefined);
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Create preview and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        setPreview(base64Data);
        onImageSelect(base64Data, file.name);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        onImageSelect(undefined, undefined);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const hasImage = preview || currentImageUrl;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {/* Image Preview */}
      <div className="flex items-start gap-4">
        <div className="border-border flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted shrink-0">
          {hasImage ? (
            <Image
              src={preview || currentImageUrl || ""}
              alt="Preview"
              width={96}
              height={96}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* File Input */}
        <div className="flex-1 space-y-2">
          <Input
            id={id}
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            disabled={disabled}
            data-testid={`${id}-input`}
          />
          <p className="text-muted-foreground text-xs">{helpText}</p>
        </div>
      </div>
    </div>
  );
}
