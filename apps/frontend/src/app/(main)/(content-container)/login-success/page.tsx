"use client";

import { ContentContainer } from "@/components/layout/ContentContainer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginSuccess() {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  }, [router]);
  return <ContentContainer>Logging in...</ContentContainer>;
}
