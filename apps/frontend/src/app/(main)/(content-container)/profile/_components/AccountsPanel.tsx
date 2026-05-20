"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ConnectedAccountRow } from "@/components/kanaliiga/ConnectedAccountRow";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { DiscordIcon } from "@/components/kanaliiga/icons/DiscordIcon";
import { SteamIcon } from "@/components/kanaliiga/icons/SteamIcon";
import { clientApiFetch } from "@/lib/apiClient";
import { envConfig } from "@/configs/env";
import { toast } from "sonner";
import { useFaceitPlayerData } from "@/hooks/data/useFaceitPlayerData";
import { useSteamPlayer } from "@/hooks/data/useSteamPlayer";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";
import type { UserFullPayload } from "@eggosystem/types";

function FaceitIcon() {
  return (
    <Image
      src={createNextUrl("/images/faceit/icon-pheasant.png")}
      alt="Faceit"
      width={18}
      height={14}
      className="object-contain"
    />
  );
}

interface AccountsPanelProps {
  user: UserFullPayload;
  checkAuth: () => Promise<void>;
}

export function AccountsPanel({ user, checkAuth }: AccountsPanelProps) {
  const router = useRouter();
  const [showDiscordUnlink, setShowDiscordUnlink] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { faceitPlayerData } = useFaceitPlayerData(user.provider_id);
  const { steamPlayer } = useSteamPlayer(user.provider_id);

  const handleDiscordLink = () => {
    router.push(
      `${envConfig.CLIENT_API_URL}/api/v1/auth/discord/login?returnTo=profile`
    );
  };

  const handleDiscordUnlink = async () => {
    setIsUnlinking(true);
    try {
      await clientApiFetch<{ message: string }>("/api/v1/discord/unlink", {
        method: "DELETE"
      });
      toast.success("Discord account unlinked successfully");
      setShowDiscordUnlink(false);
      await checkAuth();
    } catch (error) {
      toast.error(
        `Failed to unlink Discord: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Discord account</CardTitle>
          <CardDescription>
            Linking your Discord enables automatic role assignment in the
            Kanaliiga Discord server when your team is drawn into a season.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectedAccountRow
            brand="Discord"
            icon={<DiscordIcon size={18} />}
            connected={user.discordLinked}
            statusText={
              user.discordLinked ? "Connected via OAuth" : "Not connected"
            }
            meta={
              user.discordLinked
                ? "Roles sync within 5 minutes of season start."
                : "Required for team captains to register for seasons."
            }
            onLink={handleDiscordLink}
            onUnlink={() => setShowDiscordUnlink(true)}
            disabled={isUnlinking}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Game accounts</CardTitle>
          <CardDescription>
            Steam is your primary login — it is always linked. Faceit is used
            for ELO seeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ConnectedAccountRow
            brand="Steam"
            icon={<SteamIcon size={18} />}
            connected
            statusText={`Steam ID · ${user.provider_id}`}
            meta="Steam is your primary login provider and cannot be unlinked."
          />

          <ConnectedAccountRow
            brand="Faceit"
            icon={<FaceitIcon />}
            connected={!!faceitPlayerData}
            statusText={
              faceitPlayerData
                ? `${steamPlayer?.faceit_nickname ?? faceitPlayerData.player_id} · ELO ${faceitPlayerData.elo}`
                : "Not linked"
            }
            meta={
              faceitPlayerData ? (
                <a
                  href={faceitPlayerData.faceit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kanaliiga-light-brown underline-offset-2 hover:underline"
                >
                  View Faceit profile →
                </a>
              ) : undefined
            }
          />
        </CardContent>
      </Card>

      <ConfirmationModal
        open={showDiscordUnlink}
        onOpenChange={setShowDiscordUnlink}
        onConfirm={handleDiscordUnlink}
        title="Unlink Discord Account"
        description="Are you sure you want to unlink your Discord account? Your Discord roles will be removed on the next sync."
        confirmText="Unlink"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
}
