"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface VerifyEmailSuccessButtonProps {
  showSuccessToast?: boolean;
}

export function VerifyEmailSuccessButton({
  showSuccessToast
}: VerifyEmailSuccessButtonProps) {
  const router = useRouter();

  useEffect(() => {
    if (showSuccessToast) {
      toast.success("Email verified successfully!");
    }
  }, [showSuccessToast]);

  return (
    <button
      onClick={() => router.push("/")}
      className="px-4 py-2 bg-kanaliiga-orange rounded-md cursor-pointer hover:bg-kanaliiga-orange/70"
    >
      Go to Home
    </button>
  );
}

export function VerifyEmailErrorButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/profile")}
      className="px-4 py-2 bg-kanaliiga-orange rounded-md cursor-pointer hover:bg-kanaliiga-orange/70"
    >
      Edit your Email
    </button>
  );
}
