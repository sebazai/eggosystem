"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Users,
  Shield,
  Zap,
  Crosshair,
  Flame,
  Skull,
  TrendingUp,
  DollarSign,
  Timer,
  Sparkles,
  Star,
  Activity,
  Eye,
  Swords,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PlayerRole =
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

interface RoleInfo {
  id: PlayerRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "core" | "specialist" | "meme" | "side";
  bonusDescription: string;
}

const roles: RoleInfo[] = [
  // Core Roles
  {
    id: "main_awp",
    label: "Main AWP",
    description: "Primary AWPer",
    icon: <Crosshair className="h-5 w-5" />,
    category: "core",
    bonusDescription: "+15% bonus for AWP kills"
  },
  {
    id: "leader",
    label: "Leader",
    description: "Team captain & IGL",
    icon: <Users className="h-5 w-5" />,
    category: "core",
    bonusDescription: "+10% for team rounds won"
  },
  {
    id: "support",
    label: "Support",
    description: "Utility & trades",
    icon: <Shield className="h-5 w-5" />,
    category: "core",
    bonusDescription: "+20% bonus for assists & flash assists"
  },
  {
    id: "entry_fragger",
    label: "Entry Fragger",
    description: "Opens sites",
    icon: <Zap className="h-5 w-5" />,
    category: "core",
    bonusDescription: "+25% bonus for entry kills"
  },
  {
    id: "defender",
    label: "Defender",
    description: "Holds positions",
    icon: <Shield className="h-5 w-5" />,
    category: "core",
    bonusDescription: "+15% bonus for CT-side rating"
  },
  // Specialist Roles
  {
    id: "hs_machine",
    label: "HS Machine",
    description: "Headshot specialist",
    icon: <Target className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+30% bonus for headshot kills"
  },
  {
    id: "multi_fragger",
    label: "Multi Fragger",
    description: "Multi-kill rounds",
    icon: <Flame className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+50% bonus for 3K/4K/5K rounds"
  },
  {
    id: "attacker",
    label: "Attacker",
    description: "Aggressive plays",
    icon: <Swords className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+15% bonus for T-side rating"
  },
  {
    id: "flash_master",
    label: "Flash Master",
    description: "Flash assist expert",
    icon: <Sparkles className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+40% bonus for flash assists"
  },
  {
    id: "clutch_player",
    label: "Clutch Player",
    description: "High KAST player",
    icon: <Star className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+20% bonus for clutch rounds won"
  },
  {
    id: "first_blood",
    label: "First Blood",
    description: "First kill specialist",
    icon: <Activity className="h-5 w-5" />,
    category: "specialist",
    bonusDescription: "+30% bonus for first kills"
  },
  // Side Specialist
  {
    id: "t_specialist",
    label: "T-Side Specialist",
    description: "T-side focused",
    icon: <Zap className="h-5 w-5" />,
    category: "side",
    bonusDescription: "+25% for T-side performance"
  },
  {
    id: "ct_specialist",
    label: "CT-Side Specialist",
    description: "CT-side focused",
    icon: <Shield className="h-5 w-5" />,
    category: "side",
    bonusDescription: "+25% for CT-side performance"
  },
  {
    id: "anchor",
    label: "Anchor",
    description: "Site anchor",
    icon: <Eye className="h-5 w-5" />,
    category: "side",
    bonusDescription: "+15% for site hold rounds"
  },
  // Meme/Fun Roles
  {
    id: "camper",
    label: "Camper",
    description: "Defensive positioning",
    icon: <Timer className="h-5 w-5" />,
    category: "meme",
    bonusDescription: "-10% penalty (for fun)"
  },
  {
    id: "stathunter",
    label: "Stathunter",
    description: "Consistent performance",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "meme",
    bonusDescription: "+5% for exit frags (low impact)"
  },
  {
    id: "noob",
    label: "Noob",
    description: "Learning & improving",
    icon: <Skull className="h-5 w-5" />,
    category: "meme",
    bonusDescription: "-20% penalty but +50% if 1.5+ KD"
  },
  {
    id: "eco_friendly",
    label: "Eco Friendly",
    description: "Eco round specialist",
    icon: <DollarSign className="h-5 w-5" />,
    category: "meme",
    bonusDescription: "+30% bonus for eco round kills"
  }
];

const categoryLabels = {
  core: "Core Roles",
  specialist: "Specialist Roles",
  side: "Side Specialists",
  meme: "Fun/Meme Roles"
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: Array<{
    id: string;
    name: string;
    team: string;
    role?: string;
  }>;
  currentPlayerIndex: number;
  onRoleSelect: (
    playerId: string,
    role: PlayerRole | undefined
  ) => Promise<boolean>; // Returns true on success, false on error
  onNavigate: (direction: "prev" | "next") => void;
  autoAdvance?: boolean;
}

export default function RoleAssignmentDialog({
  open,
  onOpenChange,
  players,
  currentPlayerIndex,
  onRoleSelect,
  onNavigate,
  autoAdvance = true
}: Props) {
  const currentPlayer = players[currentPlayerIndex];
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);

  const handleRoleClick = (roleId: PlayerRole) => {
    // Just show the description, don't save yet
    setSelectedRole(roleId);
  };

  const handleAssign = async () => {
    if (selectedRole && currentPlayer) {
      const success = await onRoleSelect(currentPlayer.id, selectedRole);
      if (success) {
        setSelectedRole(null);

        // Auto-advance to next player only on success
        if (autoAdvance && currentPlayerIndex < players.length - 1) {
          setTimeout(() => {
            onNavigate("next");
          }, 300);
        }
      }
      // If error, keep the role selected so user can try again or choose different role
    }
  };

  const handleNoRole = async () => {
    if (currentPlayer) {
      const success = await onRoleSelect(currentPlayer.id, undefined);
      if (success) {
        setSelectedRole(null);

        // Auto-advance to next player only on success
        if (autoAdvance && currentPlayerIndex < players.length - 1) {
          setTimeout(() => {
            onNavigate("next");
          }, 300);
        }
      }
    }
  };

  const selectedRoleInfo = selectedRole
    ? roles.find((r) => r.id === selectedRole)
    : null;

  if (!currentPlayer) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] w-[85vw] max-h-[80vh] h-[80vh] p-0 sm:!max-w-[1200px] overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-2xl mb-1">
                Assign Player Role
              </DialogTitle>
              <DialogDescription className="text-sm">
                Click a role to see details, then assign it to earn bonus points
              </DialogDescription>
            </div>
            <div className="text-base text-muted-foreground font-medium">
              {currentPlayerIndex + 1} / {players.length}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("prev")}
                disabled={currentPlayerIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div>
                <p className="text-xl font-bold">{currentPlayer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlayer.team}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentPlayer.role && (
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  Current:{" "}
                  {roles.find((r) => r.id === currentPlayer.role)?.label}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate("next")}
                disabled={currentPlayerIndex === players.length - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(80vh-160px)] overflow-hidden">
          {/* Left Side - Role Icons Grid */}
          <div className="flex-1 p-4 flex flex-col overflow-y-auto min-w-0 max-w-[calc(100%-240px)]">
            <div className="grid grid-cols-6 gap-x-3 gap-y-2.5 mb-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleClick(role.id)}
                  className={cn(
                    "flex flex-col items-center justify-center aspect-square p-2 rounded-lg border-2 transition-all hover:scale-105",
                    selectedRole === role.id
                      ? "border-primary bg-primary/20 shadow-2xl shadow-primary/50"
                      : currentPlayer.role === role.id
                        ? "border-green-500 bg-green-500/10"
                        : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-600"
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 w-6 h-6 flex items-center justify-center",
                      selectedRole === role.id
                        ? "text-primary"
                        : currentPlayer.role === role.id
                          ? "text-green-400"
                          : "text-neutral-400"
                    )}
                  >
                    <div className="scale-[1]">{role.icon}</div>
                  </div>
                  <p
                    className={cn(
                      "text-[10px] text-center font-semibold leading-tight",
                      selectedRole === role.id || currentPlayer.role === role.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {role.label}
                  </p>
                </button>
              ))}
            </div>

            {/* No Role Button */}
            <button
              onClick={handleNoRole}
              className="w-full p-2.5 rounded-lg border-2 border-neutral-800 bg-neutral-900/50 hover:border-neutral-600 transition-all"
            >
              <p className="text-xs font-semibold text-muted-foreground">
                <X className="h-4 w-4 inline mr-1" />
                No Role (Skip - No bonus points)
              </p>
            </button>
          </div>

          {/* Right Side - Selected Role Details */}
          <div className="w-[240px] flex-shrink-0 border-l border-neutral-800 p-4 bg-neutral-900/50 overflow-y-auto">
            {selectedRoleInfo ? (
              <div className="space-y-3">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-xl bg-primary/20 border-2 border-primary mb-3">
                    <div className="text-primary w-10 h-10 flex items-center justify-center">
                      <div className="scale-[1.8]">{selectedRoleInfo.icon}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    {selectedRoleInfo.label}
                  </h3>
                  <Badge variant="outline" className="mb-2 text-xs py-0.5 px-2">
                    {categoryLabels[selectedRoleInfo.category]}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoleInfo.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-green-950/30 border border-green-900/50">
                  <p className="text-xs font-semibold text-green-400 mb-1">
                    Bonus Points
                  </p>
                  <p className="text-xs text-green-300">
                    {selectedRoleInfo.bonusDescription}
                  </p>
                </div>

                <Button
                  onClick={handleAssign}
                  size="default"
                  className="w-full"
                >
                  Assign Role
                </Button>

                {currentPlayer.role === selectedRoleInfo.id && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs py-0.5 px-2">
                      Currently Assigned
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Target className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">
                  Click on a role icon to see details
                </p>
                <p className="text-xs mt-2">
                  Choose a role that matches the player&apos;s strengths
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
