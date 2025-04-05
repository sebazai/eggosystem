import { MobileLogOut } from "@/components/logout";
import { SteamLoginButton } from "@/components/steam-login";
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
