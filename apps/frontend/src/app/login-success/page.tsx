"use client";

import { TheContainer } from "@/components/layout/the-container";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginSuccess() {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  }, [router]);
  return <TheContainer>Logging in...</TheContainer>;
}
