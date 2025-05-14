"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { envConfig } from "@/configs/env";
import type { UserPayload } from "@eggosystem/types";

/**
 * Used for naive frontend dashboard UX, i.e. which pages / links can be "shown".
 */
export async function requireRole(allowedRoles: string[] = ["admin"]) {
  const cookers = await cookies();
  const token = cookers.get("access_token");

  console.log("Requiring role...");

  if (!token) {
    redirect(`${envConfig.CLIENT_API_URL}/api/v1/auth/steam`);
  }

  const [_h, payload, _s] = token.value.split(".");
  if (!payload) {
    redirect(`${envConfig.CLIENT_API_URL}/api/v1/auth/steam`);
  }

  const decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
  const unverifiedUser: UserPayload = JSON.parse(decodedPayload);

  if (!allowedRoles.some((role) => unverifiedUser.roles.includes(role))) {
    redirect("/unauthorized");
  }
  return unverifiedUser;
}
