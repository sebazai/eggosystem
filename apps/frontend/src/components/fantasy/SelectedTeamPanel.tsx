import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { X } from "lucide-react";
import { cn, createTeamLogoUrl } from "@/lib/utils";
import { NextImageFallback } from "../layout/NextImageFallback";
import type { SelectedPlayer } from "./FantasyLeague";

type Props = {
  selectedPlayers: SelectedPlayer[];
  onRemovePlayer: (playerId: number) => void;
  onRoleChange: (
    playerId: number,
    role: SelectedPlayer["role"]
  ) => void;
  onFinalize: () => void;
  budgetRemaining: number;
};

type PlayerRole = 
  | "main_awp"
  | "leader"
  | "support"
  | "entry_fragger"
  | "defender"
  | "hs_machine"
  | "multi_fragger"
  | "attacker"
  | "camper"
  | "stathunter"
  | "noob"
  | "eco_friendly"
  | "flash_master"
  | "clutch_player"
  | "first_blood"
  | "t_specialist"
  | "ct_specialist"
  | "anchor";

const roleLabels: Record<PlayerRole, string> = {
  main_awp: "Main AWP",
  leader: "Leader",
  support: "Support",
  entry_fragger: "Entry Fragger",
  defender: "Defender",
  hs_machine: "HS Machine",
  multi_fragger: "Multi Fragger",
  attacker: "Attacker",
  camper: "Camper",
  stathunter: "Stathunter",
  noob: "Noob",
  eco_friendly: "Eco Friendly",
  flash_master: "Flash Master",
  clutch_player: "Clutch Player",
  first_blood: "First Blood",
  t_specialist: "T-Side Specialist",
  ct_specialist: "CT-Side Specialist",
  anchor: "Anchor"
};

const roleDescriptions: Record<PlayerRole, string> = {
  main_awp: "Primary AWPer",
  leader: "Team captain & IGL",
  support: "Utility & trades",
  entry_fragger: "Opens sites",
  defender: "Holds positions",
  hs_machine: "Headshot specialist",
  multi_fragger: "Multi-kill rounds",
  attacker: "Aggressive plays",
  camper: "Defensive positioning",
  stathunter: "Consistent performance",
  noob: "Learning & improving",
  eco_friendly: "Eco round specialist",
  flash_master: "Flash assist expert",
  clutch_player: "High KAST player",
  first_blood: "First kill specialist",
  t_specialist: "T-side focused",
  ct_specialist: "CT-side focused",
  anchor: "Site anchor"
};

const tierFrameGradients = {
  gold: "from-[#FFD866] via-[#E0A424] to-[#A06A1C]",
  silver: "from-[#E8E8E8] via-[#C0C0C0] to-[#8C8C8C]",
  bronze: "from-[#E09E5C] via-[#B8753C] to-[#8B5A2B]"
} as const;

const tierCardShadow = {
  gold: "shadow-[0_6px_16px_rgba(224,164,36,0.3)]",
  silver: "shadow-[0_6px_16px_rgba(140,140,140,0.3)]",
  bronze: "shadow-[0_6px_16px_rgba(139,90,43,0.3)]"
} as const;

const tierInnerGlow = {
  gold: "shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.3)]",
  silver: "shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.2)]",
  bronze: "shadow-[inset_0_1px_2px_rgba(255,200,150,0.4),inset_0_-1px_2px_rgba(0,0,0,0.3)]"
} as const;

const tierAccents = {
  gold: "bg-gradient-to-br from-[#FFD866] via-[#E0A424] to-[#C89020]",
  silver: "bg-gradient-to-br from-[#E8E8E8] via-[#C0C0C0] to-[#A0A0A0]",
  bronze: "bg-gradient-to-br from-[#E09E5C] via-[#B8753C] to-[#9A5F30]"
} as const;

const tierTextColor = {
  gold: "text-black",
  silver: "text-black",
  bronze: "text-white"
} as const;

export default function SelectedTeamPanel({
  selectedPlayers,
  onRemovePlayer,
  onRoleChange,
  onFinalize,
  budgetRemaining
}: Props) {
  const isTeamComplete = selectedPlayers.length === 5;
  
  // Get roles that are already assigned
  const assignedRoles = new Set(
    selectedPlayers.map((p) => p.role).filter((r): r is PlayerRole => r !== undefined)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Team</span>
          <div className="flex items-center gap-4">
            <Badge variant={isTeamComplete ? "default" : "outline"}>
              {selectedPlayers.length} / 5
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Budget:</span>
              <span
                className={cn(
                  "text-lg font-bold",
                  budgetRemaining < 0
                    ? "text-destructive"
                    : "text-green-600 dark:text-green-400"
                )}
              >
                ${budgetRemaining.toLocaleString()}
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Player Slots - Horizontal Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => {
            const player = selectedPlayers[index];

            if (!player) {
              return (
                <div
                  key={`empty-${index}`}
                  className={cn(
                    "border-2 border-dashed border-neutral-700 p-4 text-center text-gray-600 flex flex-col items-center justify-center min-h-[200px] rounded-2xl",
                    "bg-neutral-900/50"
                  )}
                >
                  <div className="text-4xl mb-2 font-bold">?</div>
                  <div className="text-xs uppercase tracking-wider font-bold">Empty</div>
                </div>
              );
            }

            const teamLogoUrl = player.teamLogo || createTeamLogoUrl(player.team.toLowerCase().replace(/\s+/g, '-') + '.png');

            return (
              <div key={player.id} className="relative">
                {/* Premium Frame */}
                <div className={cn(
                  "relative p-[3px] h-full bg-gradient-to-b rounded-2xl",
                  tierFrameGradients[player.tier],
                  tierCardShadow[player.tier],
                  tierInnerGlow[player.tier]
                )}>
                  {/* Inner Border */}
                  <div className={cn(
                    "absolute inset-[3px] border border-black/40 rounded-[14px]",
                    "pointer-events-none"
                  )} />
                  
                  {/* Inner Card */}
                  <div className="relative bg-neutral-900 h-full w-full rounded-[14px] overflow-hidden">
                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onRemovePlayer(player.id)}
                      className="absolute top-1 right-1 h-6 w-6 bg-red-900/80 hover:bg-red-800 z-10 rounded-sm"
                    >
                      <X className="h-3 w-3 text-white" />
                    </Button>

                    {/* Team Logo Badge */}
                    <div className="absolute top-1 left-1 z-10">
                      <div className={cn(
                        "p-0.5 rounded-full bg-gradient-to-br",
                        tierFrameGradients[player.tier]
                      )}>
                        <NextImageFallback
                          src={teamLogoUrl}
                          alt={player.team}
                          width={20}
                          height={20}
                          className="rounded-full bg-neutral-900"
                        />
                      </div>
                    </div>

                    {/* Player Photo with gradient overlay */}
                    <div className="relative bg-gradient-to-b from-neutral-800 to-neutral-900 h-28 flex items-center justify-center overflow-hidden">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-3xl text-gray-600 font-bold">?</div>
                      )}
                      
                      {/* Overlay */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-10",
                        tierFrameGradients[player.tier],
                        "mix-blend-overlay"
                      )} />
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>

                    <div className="p-2 space-y-2 bg-gradient-to-b from-neutral-900 to-neutral-950">
                      {/* Premium Player Name Banner */}
                      <div className={cn(
                        "relative text-center py-1.5 px-2 font-black text-xs uppercase tracking-wider rounded-lg",
                        tierAccents[player.tier],
                        tierTextColor[player.tier],
                        tierInnerGlow[player.tier],
                        "shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
                      )}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-lg" />
                        <div className="relative truncate">{player.name}</div>
                      </div>

                      {/* Value */}
                      <div className="text-center">
                        <span className="text-xs font-black text-green-400/90 drop-shadow-[0_0_4px_rgba(74,222,128,0.4)]">
                          ${(player.value / 1000).toFixed(0)}K
                        </span>
                      </div>

                      {/* Role Selection */}
                      <Select
                        value={player.role || "none"}
                        onValueChange={(value) =>
                          onRoleChange(
                            player.id,
                            value === "none"
                              ? undefined
                              : (value as SelectedPlayer["role"])
                          )
                        }
                      >
                        <SelectTrigger className="h-7 text-[9px] font-black uppercase tracking-wider bg-neutral-800/60 border-neutral-700">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Role</SelectItem>
                          {(Object.entries(roleLabels) as [PlayerRole, string][]).map(([value, label]) => (
                            <SelectItem
                              key={value}
                              value={value}
                              disabled={
                                assignedRoles.has(value) &&
                                player.role !== value
                              }
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Finalize Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            onClick={onFinalize}
            disabled={!isTeamComplete || budgetRemaining < 0}
            className="flex-1"
            size="lg"
            variant="kanaliigaOrange"
          >
            {!isTeamComplete
              ? `Add ${5 - selectedPlayers.length} More Player${5 - selectedPlayers.length > 1 ? "s" : ""}`
              : budgetRemaining < 0
                ? "Over Budget!"
                : "Finalize Team"}
          </Button>
          
          {/* Info Text */}
          <div className="text-xs text-muted-foreground flex-1 text-center sm:text-left">
            {isTeamComplete && budgetRemaining >= 0 && (
              <p>✓ Ready to finalize your team!</p>
            )}
            {selectedPlayers.length < 5 && (
              <p>Select {5 - selectedPlayers.length} more player{5 - selectedPlayers.length > 1 ? "s" : ""}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

