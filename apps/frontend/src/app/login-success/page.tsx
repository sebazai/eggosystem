"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginSuccess() {
  const router = useRouter();
  useEffect(() => {
    router.push("/");
  }, [router]);
  return <div>Logging in...</div>;
}
