import { MobileLogOut } from "@/components/profile/logout";
import { SteamLoginButton } from "@/components/profile/steam-login";
import { useAuth } from "@/context/AuthContext";
import { SettingsIcon } from "lucide-react";
import Link from "next/link";

interface MobileUserMenuProps {
  setIsSheetOpen: (isOpen: boolean) => void;
}

export const MobileUserMenu = ({ setIsSheetOpen }: MobileUserMenuProps) => {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center justify-between p-4">
      {user ? (
        <MobileLogOut logOutUser={() => logout()} />
      ) : (
        <SteamLoginButton />
      )}
      {user ? (
        <div className="flex gap-2">
          <SettingsIcon />{" "}
          <Link href="/profile" onClick={() => setIsSheetOpen(false)}>
            Profile
          </Link>
        </div>
      ) : null}
    </div>
  );
};
