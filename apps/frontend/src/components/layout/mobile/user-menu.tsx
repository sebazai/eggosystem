import { LogOut } from "@/components/logout";
import { SteamLoginButton } from "@/components/steam-login";
import { useAuth } from "@/context/AuthContext";

export const MobileUserMenu = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      {user ? <LogOut logOutUser={() => logout()} /> : <SteamLoginButton />}
    </div>
  );
};
