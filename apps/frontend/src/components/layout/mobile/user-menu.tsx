import { LogOut } from "@/components/logout";
import { SteamLoginButton } from "@/components/steam-login";
import useSession from "@/hooks/useSession";

export const MobileUserMenu = () => {
  const { user, setUser } = useSession();
  return (
    <div>
      {user ? (
        <LogOut logOutUser={() => setUser(null)} />
      ) : (
        <SteamLoginButton />
      )}
    </div>
  );
};
