"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tv } from "lucide-react";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { hasCasterAccess } from "@/lib/roleUtils";
import { useIsMatch2xBO1StreamReservation } from "@/hooks/data/useIsMatch2xBO1StreamReservation";

interface StreamReservationProps {
  matchId: string;
  onReservationSuccess: () => void;
}

interface CasterDefaultUrl {
  default_stream_url: string | null;
}

export function StreamReservation({
  matchId,
  onReservationSuccess
}: StreamReservationProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [reserveBothGames, setReserveBothGames] = useState(true);
  const { is2xBO1, isLoading: _isLoadingIs2xBO1 } =
    useIsMatch2xBO1StreamReservation(matchId);

  const canReserve = hasCasterAccess(user);

  if (!canReserve) {
    return null; // Don't show button if user doesn't have caster role
  }

  const loadDefaultStreamUrl = async () => {
    setIsLoadingDefault(true);
    try {
      const response = await clientApiFetch<CasterDefaultUrl>(
        "/api/v1/accounts/caster/default-url"
      );
      if (response.default_stream_url) {
        setStreamUrl(response.default_stream_url);
      }
    } catch (_error) {
      // If no default URL is found, just continue with empty input
      console.log("No default stream URL found");
    } finally {
      setIsLoadingDefault(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadDefaultStreamUrl(); // Auto-load default URL when opening
  };

  const handleReserve = async () => {
    if (!streamUrl.trim()) {
      toast.error("Please enter a stream URL");
      return;
    }

    setIsLoading(true);
    try {
      await clientApiFetch(`/api/v1/matches/${matchId}/reserve-cast`, {
        method: "POST",
        body: JSON.stringify({
          stream_url: streamUrl,
          reserve_both_games: is2xBO1 ? reserveBothGames : undefined
        })
      });

      toast.success("Stream reserved successfully!");
      setIsOpen(false);
      setStreamUrl("");
      setReserveBothGames(true); // Reset to default
      onReservationSuccess();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reserve stream"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleOpen}
          className="flex items-center gap-2 w-full"
          variant="outline"
        >
          <Tv className="h-4 w-4" />
          Reserve for Streaming
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve Match for Streaming</DialogTitle>
          <DialogDescription>
            Enter your stream URL to reserve this match for casting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streamUrl">Stream URL</Label>
            <Input
              id="streamUrl"
              type="url"
              placeholder="https://twitch.tv/your-channel"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              disabled={isLoading || isLoadingDefault}
            />
            {isLoadingDefault && (
              <p className="text-sm text-muted-foreground">
                Loading your default URL...
              </p>
            )}
          </div>
          {is2xBO1 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reserveBothGames"
                checked={reserveBothGames}
                onCheckedChange={(checked) =>
                  setReserveBothGames(checked === true)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="reserveBothGames"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Reserve both BO1 games for same day
              </Label>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleReserve}
              disabled={isLoading || !streamUrl.trim()}
              className="flex-1"
            >
              {isLoading ? "Reserving..." : "Reserve Stream"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
