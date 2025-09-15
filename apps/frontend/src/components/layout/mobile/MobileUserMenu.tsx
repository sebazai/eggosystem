import { MobileLogOut } from "@/components/profile/MobileLogOut";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { useAuth } from "@/context/AuthContext";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "../ThemeToggle";
import { createNextUrl } from "@/lib/utils";

interface MobileUserMenuProps {
  setIsSheetOpen: (isOpen: boolean) => void;
}

export const MobileUserMenu = ({ setIsSheetOpen }: MobileUserMenuProps) => {
  const { user, logout } = useAuth();
  return (
    <div className="flex flex-wrap items-center gap-4 justify-between p-4">
      {user ? (
        <MobileLogOut logOutUser={() => logout()} />
      ) : (
        <SteamLoginButton />
      )}
      {user ? (
        <div className="flex items-center gap-2">
          <SettingsIcon className="min-w-4 min-h-4 w-4 h-4 xxs:w-6 xxs:h-6" />
          <Link
            href={createNextUrl("/profile")}
            onClick={() => setIsSheetOpen(false)}
          >
            Profile
          </Link>
        </div>
      ) : null}
      <div>
        <ModeToggle />
      </div>
    </div>
  );
};
