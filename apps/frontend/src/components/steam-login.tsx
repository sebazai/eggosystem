import { envConfig } from "@/configs/env";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "./ui/button";
import { createNextImageUrl } from "@/lib/utils";

// components/SteamLoginButton.tsx
export const SteamLoginButton = () => {
  const router = useRouter();
  const handleLogin = () => {
    router.push(`${envConfig.CLIENT_API_URL}/api/v1/auth/steam`);
  };

  return (
    <Button variant="link" onClick={handleLogin}>
      <Image
        src={createNextImageUrl("/images/sits_01.png")}
        alt="Steam login"
        width={180}
        height={35}
      />
    </Button>
  );
};
