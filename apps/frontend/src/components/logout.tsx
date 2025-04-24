import { clientApiFetch } from "@/lib/apiClient";
import { LogOutIcon } from "lucide-react";
import { DropdownMenuItem } from "./ui/dropdown-menu";
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
    <div className="flex gap-2" onClick={handleLogout}>
      <LogOutIcon /> Sign Out
    </div>
  );
};
