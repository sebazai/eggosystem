import { envConfig } from "@/configs/env";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "./ui/button";

// components/SteamLoginButton.tsx
export const SteamLoginButton = () => {
  const router = useRouter();
  const handleLogin = () => {
    router.push(`${envConfig.API_URL}/api/v1/auth/steam`);
  };

  return (
    <Button variant="link" onClick={handleLogin}>
      <Image
        src="/images/sits_01.png"
        alt="Steam login"
        width={180}
        height={35}
      />
    </Button>
  );
};
