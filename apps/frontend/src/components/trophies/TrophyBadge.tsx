import { TrophyIcon } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { envConfig } from "@/configs/env";

interface TrophyBadgeProps {
  imagePhash: string | null;
  displayText: string;
  seasonId: number;
  placement: number | null;
  category: "season_placement" | "kanarating" | "special";
}

/**
 * Get trophy image URL from image service
 */
const getTrophyImageUrl = (imagePhash: string | null): string | null => {
  if (!imagePhash) return null;
  return `${envConfig.IMAGE_SERVICE_URL}/images/by-hash/phash/${imagePhash}`;
};

/**
 * Get color classes based on placement
 */
const getPlacementColors = (
  placement: number | null
): { icon: string; badge: string } => {
  switch (placement) {
    case 1:
      return { icon: "text-yellow-400", badge: "bg-yellow-400 text-black" };
    case 2:
      return { icon: "text-slate-400", badge: "bg-slate-400 text-black" };
    case 3:
      return { icon: "text-amber-700", badge: "bg-amber-700 text-white" };
    default:
      return {
        icon: "text-muted-foreground",
        badge: "bg-muted-foreground text-white"
      };
  }
};

/**
 * Shared trophy badge component for displaying trophies on player/team pages
 * Text is shown as tooltip on hover
 */
export const TrophyBadge = ({
  imagePhash,
  displayText,
  seasonId,
  placement,
  category
}: TrophyBadgeProps) => {
  const imageUrl = getTrophyImageUrl(imagePhash);
  const colors = getPlacementColors(placement);

  return (
    <div className="relative cursor-pointer" title={displayText}>
      {imageUrl ? (
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={displayText}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div
          className={clsx(
            "w-12 h-12 rounded-full flex items-center justify-center",
            category === "season_placement"
              ? "bg-gradient-to-br from-amber-900/50 to-amber-700/30"
              : category === "kanarating"
                ? "bg-gradient-to-br from-indigo-900/50 to-indigo-700/30"
                : "bg-gradient-to-br from-slate-900/50 to-slate-700/30"
          )}
        >
          <TrophyIcon className={clsx("w-6 h-6", colors.icon)} />
        </div>
      )}

      {/* Season badge overlay */}
      <div
        className={clsx(
          "absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-xs font-bold",
          colors.badge
        )}
      >
        #{seasonId}
      </div>
    </div>
  );
};
