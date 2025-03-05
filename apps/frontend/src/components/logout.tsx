import { apiFetch } from "@/lib/apiClient";

export const LogOut = () => {
  const handleLogin = async () => {
    const res = await apiFetch(`/auth/logout`);
    console.log(res);
  };

  return <div onClick={handleLogin}>Logout</div>;
};
