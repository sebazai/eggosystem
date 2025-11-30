"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import { useMyTeams } from "@/hooks/data/user/useMyTeams";
import Image from "next/image";

interface TeamEditDialogProps {
  teamId: number;
  currentLogoUrl: string;
  currentTeamName: string;
}

export function TeamEditDialog({
  teamId,
  currentLogoUrl,
  currentTeamName
}: TeamEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [teamName, setTeamName] = useState(currentTeamName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate } = useMyTeams();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const body: {
        team_id: number;
        image_data?: string;
        filename?: string;
        team_name?: string;
      } = {
        team_id: teamId
      };

      // Add image data if a new file was selected
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body.image_data = base64;
        body.filename = file.name;
      }

      // Add team name if it changed
      if (teamName.trim() !== currentTeamName.trim()) {
        body.team_name = teamName.trim();
      }

      // Only make request if there are changes
      if (!body.image_data && !body.team_name) {
        toast.info("No changes to save");
        setIsOpen(false);
        return;
      }

      // Update to backend
      const response = await clientApiFetch<{
        success: boolean;
        phash?: string;
        message: string;
      }>("/api/v1/accounts/my-teams/upload-logo", {
        method: "POST",
        body: JSON.stringify(body)
      });

      if (response.success) {
        toast.success(response.message);
        setIsOpen(false);
        setPreview(null);
        setTeamName(currentTeamName); // Reset to current name
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh team data
        await mutate();
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update team information. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPreview(null);
    setTeamName(currentTeamName); // Reset to current name
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update your team logo and name. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Team Name Input */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={isSaving}
              placeholder="Enter team name"
            />
          </div>

          {/* Current Logo Display */}
          <div className="space-y-2">
            <Label>Current Logo</Label>
            <div className="border-border flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border">
              <Image
                src={preview || currentLogoUrl || "/placeholder-team.png"}
                alt="Team logo"
                width={128}
                height={128}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="logo-file">Change Logo (Optional)</Label>
            <Input
              id="logo-file"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isSaving}
            />
            <p className="text-muted-foreground text-xs">
              Supported formats: PNG, JPG, GIF, WEBP. Max size: 10MB
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
