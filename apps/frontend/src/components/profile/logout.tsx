import { clientApiFetch } from "@/lib/apiClient";
import { LogOutIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
interface LogOutProps {
  logOutUser: () => void;
}

export const DesktopLogOut = ({ logOutUser }: LogOutProps) => {
  const handleLogout = async () => {
    await clientApiFetch(`/api/v1/auth/logout`);
    logOutUser();
  };
  return (
    <DropdownMenuItem asChild>
      <div className="cursor-pointer" onClick={handleLogout}>
        <LogOutIcon /> Sign Out
      </div>
    </DropdownMenuItem>
  );
};

export const MobileLogOut = ({ logOutUser }: LogOutProps) => {
  const handleLogout = async () => {
    await clientApiFetch(`/api/v1/auth/logout`);
    logOutUser();
  };
  return (
    <div className="flex gap-2 items-center" onClick={handleLogout}>
      <LogOutIcon className="min-w-4 min-h-4 w-4 h-4 xxs:w-6 xxs:h-6" /> Log out
    </div>
  );
};
