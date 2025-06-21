import { clientApiFetch } from "@/lib/apiClient";
import { LogOutIcon } from "lucide-react";

interface LogOutProps {
  logOutUser: () => void;
}
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
