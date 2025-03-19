import { apiFetch } from "@/lib/apiClient";
import { LogOutIcon } from "lucide-react";
interface LogOutProps {
  logOutUser: () => void;
}
export const LogOut = ({ logOutUser }: LogOutProps) => {
  const handleLogout = async () => {
    await apiFetch({ url: `/auth/logout` });
    logOutUser();
  };

  return (
    <div className="flex gap-2" onClick={handleLogout}>
      <LogOutIcon /> Sign Out
    </div>
  );
};
