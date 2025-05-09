"use client";

import { createContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

const AcceptPolicyContext = createContext(undefined);

export const AcceptPolicyProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Force redirect if the user is logged in but hasn't accepted the privacy policy
    if (
      user &&
      !user.acceptedPrivacyPolicy &&
      !pathname.includes("profile") &&
      !pathname.includes("privacy-policy")
    ) {
      router.push(`/profile?acceptPrivacyPolicyRequired=1`);
    }
  }, [user, router, pathname]);

  return (
    <AcceptPolicyContext.Provider value={undefined}>
      {children}
    </AcceptPolicyContext.Provider>
  );
};
