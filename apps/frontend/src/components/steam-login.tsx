"use client";
import { envConfig } from "@/configs/env";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "./ui/button";
import { createNextUrl } from "@/lib/utils";

// components/SteamLoginButton.tsx
export const SteamLoginButton = ({
  children,
  returnUrl
}: {
  children?: React.ReactNode;
  returnUrl?: string;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const encodedUri = encodeURIComponent(returnUrl ?? pathname);
  const handleLogin = () => {
    router.push(
      `${envConfig.CLIENT_API_URL}/api/v1/auth/steam?returnUrl=${encodedUri}`
    );
  };

  return (
    <Button
      className="flex flex-col cursor-pointer"
      variant="link"
      onClick={handleLogin}
      data-testid="steam-login-button"
    >
      <Image
        src={createNextUrl("/images/sits_01.png")}
        alt="Steam login"
        width={180}
        height={35}
      />
      {children}
    </Button>
  );
};
