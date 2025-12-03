"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  useCreateSeasonLeagueExternalId,
  useUpdateSeasonLeagueExternalId
} from "@/hooks/data/dashboard/useSeasonLeagueMapper";
import type { SeasonLeagueExternalId } from "@eggosystem/types";

interface MappingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  seasonId: number;
  leagueId: number;
  leagueName: string;
  editingMapping?: SeasonLeagueExternalId;
}

export function MappingFormDialog({
  isOpen,
  onClose,
  seasonId,
  leagueId,
  leagueName,
  editingMapping
}: MappingFormDialogProps) {
  const [externalId, setExternalId] = useState("");
  const [externalLeagueName, setExternalLeagueName] = useState("");
  const [stageId, setStageId] = useState<string>("1");
  const [type, setType] = useState<string>("roundRobin");
  const [manualGroup, setManualGroup] = useState<string>("");

  const createMutation = useCreateSeasonLeagueExternalId();
  const updateMutation = useUpdateSeasonLeagueExternalId();

  // Populate form when editing
  useEffect(() => {
    if (editingMapping) {
      setExternalId(editingMapping.external_id);
      setExternalLeagueName(editingMapping.external_league_name || "");
      setStageId(editingMapping.stage_id.toString());
      setType(editingMapping.type);
      setManualGroup(editingMapping.manual_group?.toString() || "");
    } else {
      // Reset form when creating new
      setExternalId("");
      setExternalLeagueName("");
      setStageId("1");
      setType("roundRobin");
      setManualGroup("");
    }
  }, [editingMapping, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMapping) {
        await updateMutation.mutateAsync({
          id: editingMapping.id,
          data: {
            external_id: externalId,
            external_league_name: externalLeagueName,
            stage_id: parseInt(stageId) as 1 | 2,
            type: type as
              | "roundRobin"
              | "doubleElimination"
              | "singleElimination",
            manual_group: manualGroup ? parseInt(manualGroup) : null
          }
        });
      } else {
        await createMutation.mutateAsync({
          season_id: seasonId,
          league_id: leagueId,
          external_id: externalId,
          external_league_name: externalLeagueName,
          stage_id: parseInt(stageId) as 1 | 2,
          type: type as
            | "roundRobin"
            | "doubleElimination"
            | "singleElimination",
          manual_group: manualGroup ? parseInt(manualGroup) : null
        });
      }
      handleClose();
    } catch {
      // Error is already handled by the hooks
    }
  };

  const handleClose = () => {
    setExternalId("");
    setExternalLeagueName("");
    setStageId("1");
    setType("roundRobin");
    setManualGroup("");
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingMapping ? "Edit Mapping" : "Add New Mapping"}
          </DialogTitle>
          <DialogDescription>
            {editingMapping
              ? "Update the external championship mapping."
              : `Create a new external championship mapping for ${leagueName}.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="externalId">External ID *</Label>
            <Input
              id="externalId"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g., faceit-championship-id"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              The FaceIT championship ID from the webhook
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalLeagueName">External League Name *</Label>
            <Input
              id="externalLeagueName"
              value={externalLeagueName}
              onChange={(e) => setExternalLeagueName(e.target.value)}
              placeholder="e.g., Masters S3 Playoffs"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              The championship name from FaceIT
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage *</Label>
            <Select
              value={stageId}
              onValueChange={setStageId}
              disabled={isPending}
            >
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Regular</SelectItem>
                <SelectItem value="2">Playoff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={setType} disabled={isPending}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roundRobin">Round Robin</SelectItem>
                <SelectItem value="doubleElimination">
                  Double Elimination
                </SelectItem>
                <SelectItem value="singleElimination">
                  Single Elimination
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualGroup">Manual Group (Optional)</Label>
            <Input
              id="manualGroup"
              type="number"
              value={manualGroup}
              onChange={(e) => setManualGroup(e.target.value)}
              placeholder="e.g., 1 for Lohko A, 2 for Lohko B"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Used for multi-group round robin tournaments (e.g., Lohko A/B)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? editingMapping
                  ? "Updating..."
                  : "Creating..."
                : editingMapping
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
