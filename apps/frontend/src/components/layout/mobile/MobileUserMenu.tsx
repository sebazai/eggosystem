import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { useAuth } from "@/context/AuthContext";
import { SettingsIcon, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface MobileUserMenuProps {
  setIsSheetOpen: (isOpen: boolean) => void;
}

export const MobileUserMenu = ({ setIsSheetOpen }: MobileUserMenuProps) => {
  const { user } = useAuth();
  return (
    <div>
      <Separator />
      <div className="flex flex-wrap items-center gap-4 justify-between m-4">
        {user ? (
          <>
            <div className="flex items-center gap-2">
              <SettingsIcon className="min-w-4 min-h-4 w-4 h-4 xxs:w-6 xxs:h-6" />
              <Link
                href={createNextUrl("/profile")}
                onClick={() => setIsSheetOpen(false)}
              >
                Profile
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Users className="min-w-4 min-h-4 w-4 h-4 xxs:w-6 xxs:h-6" />
              <Link
                href={createNextUrl("/my-team")}
                onClick={() => setIsSheetOpen(false)}
              >
                Your Team
              </Link>
            </div>
            {user.provider_id && (
              <div className="flex items-center gap-2">
                <BarChart3 className="min-w-4 min-h-4 w-4 h-4 xxs:w-6 xxs:h-6" />
                <Link
                  href={createNextUrl(`/players/${user.provider_id}`)}
                  onClick={() => setIsSheetOpen(false)}
                >
                  Your Stats
                </Link>
              </div>
            )}
          </>
        ) : (
          <SteamLoginButton />
        )}
      </div>
    </div>
  );
};
