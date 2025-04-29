"use client";

import { useRouter } from "next/navigation";

export function VerifyEmailSuccessButton() {
  const router = useRouter();

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
