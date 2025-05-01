"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export const SignupButton = () => {
  const router = useRouter();
  return (
    <Button
      onClick={() => {
        router.push("/seasons/16/signup");
      }}
      className="text-lg px-8 py-12"
    >
      Register Your Company
    </Button>
  );
};
