"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import { useUpdateLeagueName } from "@/hooks/data/dashboard/useSeasonLeagueMapper";
import { cn } from "@/lib/utils";

interface LeagueNameEditorProps {
  leagueId: number;
  initialName: string;
  isDuplicate?: boolean;
}

export function LeagueNameEditor({
  leagueId,
  initialName,
  isDuplicate
}: LeagueNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(initialName);
  const updateLeagueName = useUpdateLeagueName();

  const handleSave = async () => {
    if (editedName.trim() === "" || editedName === initialName) {
      setIsEditing(false);
      setEditedName(initialName);
      return;
    }

    try {
      await updateLeagueName.mutateAsync({
        leagueId,
        name: editedName.trim()
      });
      setIsEditing(false);
    } catch {
      // Error is already handled by the hook
      setEditedName(initialName);
    }
  };

  const handleCancel = () => {
    setEditedName(initialName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 max-w-[200px]"
          autoFocus
          disabled={updateLeagueName.isPending}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={updateLeagueName.isPending}
          className="h-8 w-8 p-0"
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={updateLeagueName.isPending}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span
        className={cn(
          "font-medium",
          isDuplicate && "text-orange-600 dark:text-orange-400"
        )}
      >
        {initialName}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
