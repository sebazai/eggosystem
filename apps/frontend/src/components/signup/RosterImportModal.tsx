"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useTeamRosterHistory } from "@/hooks/data/useTeamRosterHistory";
import type { SignupPlayerType } from "@eggosystem/types";
import { Users } from "lucide-react";

interface RosterImportModalProps {
  teamId: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (players: SignupPlayerType[]) => void;
}

export const RosterImportModal = ({
  teamId,
  open,
  onOpenChange,
  onImport
}: RosterImportModalProps) => {
  const { rosterHistory, isLoading, isError } = useTeamRosterHistory(
    open ? teamId : undefined
  );
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");

  const selectedSeason = rosterHistory?.seasons.find(
    (s) => s.seasonId === Number(selectedSeasonId)
  );

  const handleImport = () => {
    if (!selectedSeason) return;

    const players: SignupPlayerType[] = selectedSeason.players.map((p) => ({
      accountId: 0,
      steamId: p.steamId,
      nickname: p.nickname,
      captain: p.isCaptain,
      coCaptain: p.isCoCaptain,
      hasValidData: undefined,
      hasValidWorkEmail: undefined,
      isEmailVerified: undefined,
      hours: undefined,
      rank: undefined,
      externalRank: undefined
    }));

    onImport(players);
    onOpenChange(false);
    setSelectedSeasonId("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedSeasonId("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import roster from previous season
          </DialogTitle>
          <DialogDescription>
            Select a season to import the player roster from. You can still
            modify the roster after importing.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="text-destructive py-4">
            Failed to load roster history.
          </div>
        ) : !rosterHistory?.seasons.length ? (
          <div className="text-muted-foreground py-4">
            No previous registrations found for this team.
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedSeasonId}
              onValueChange={setSelectedSeasonId}
            >
              <SelectTrigger data-testid="roster-import-season-select">
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {rosterHistory.seasons.map((season) => (
                  <SelectItem
                    key={season.seasonId}
                    value={String(season.seasonId)}
                    data-testid={`roster-import-season-${season.seasonId}`}
                  >
                    {season.seasonName} ({season.players.length} players)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSeason && (
              <div
                className="border rounded-lg p-4 space-y-2"
                data-testid="roster-import-preview"
              >
                <h4 className="font-medium text-sm">Players in roster:</h4>
                <div className="space-y-1">
                  {selectedSeason.players.map((player, idx) => (
                    <div
                      key={player.steamId}
                      className="flex items-center gap-2 text-sm"
                      data-testid={`roster-import-player-${idx}`}
                    >
                      <span className="text-muted-foreground w-5">
                        {idx + 1}.
                      </span>
                      <span>{player.nickname || player.steamId}</span>
                      {player.isCaptain && (
                        <Badge variant="default" className="text-xs">
                          Captain
                        </Badge>
                      )}
                      {player.isCoCaptain && (
                        <Badge variant="secondary" className="text-xs">
                          Co-Captain
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedSeason}
            data-testid="roster-import-confirm-button"
          >
            Import roster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
