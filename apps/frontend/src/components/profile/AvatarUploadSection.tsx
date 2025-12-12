"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Camera, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { createAvatarUrl } from "@/lib/utils";
import { useSWRConfig } from "swr";

interface AvatarUploadSectionProps {
  currentAvatar?: string | null;
  steamId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp"
];

export const AvatarUploadSection = ({
  currentAvatar,
  steamId
}: AvatarUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { mutate } = useSWRConfig();
  const { checkAuth } = useAuth();

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload a PNG, JPEG, GIF, or WebP image."
        );
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
        );
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleUpload = async () => {
    if (!preview) return;

    setIsUploading(true);
    try {
      await clientApiFetch<{ message: string; phash: string }>(
        "/api/v1/accounts/upload-avatar",
        {
          method: "POST",
          body: JSON.stringify({ image_data: preview })
        }
      );

      toast.success("Avatar updated successfully!");
      setPreview(null);

      // Invalidate cached player data to show new avatar
      await mutate(`/api/v1/players/${steamId}`);
      await checkAuth();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const avatarUrl = currentAvatar ? createAvatarUrl(currentAvatar) : null;
  const displayImage = preview || avatarUrl;

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4">Profile Avatar</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a custom avatar to display on your player profile, team pages,
        and match lineups.
      </p>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-kanaliiga-light-brown/30 flex items-center justify-center">
            {displayImage ? (
              <Image
                src={displayImage}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized={!!preview} // Don't optimize base64 previews
              />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Camera overlay for selecting file */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 rounded-full p-2 transition-colors"
            disabled={isUploading}
          >
            <Camera className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="avatar-file-input"
          />

          {preview ? (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                data-testid="upload-avatar-button"
              >
                {isUploading ? "Uploading..." : "Save Avatar"}
              </Button>
              <Button
                variant="outline"
                onClick={clearPreview}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="select-avatar-button"
            >
              <Camera className="h-4 w-4 mr-2" />
              {currentAvatar ? "Change Avatar" : "Upload Avatar"}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Supported formats: PNG, JPEG, GIF, WebP. Max size: 10MB.
          </p>
        </div>
      </div>
    </div>
  );
};
