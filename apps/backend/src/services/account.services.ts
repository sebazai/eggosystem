import { expireInOneDay, redisClient } from "../utils/redisClient";
import { sendVerificationEmail } from "./email.services";

export const handleEmailVerification = async (
  accountId: number,
  email: string,
  redisKey: string,
  emailToken: string,
  expirationTimeMillis: number
) => {
  await redisClient.set(
    `${redisKey}:${emailToken}`,
    JSON.stringify({
      accountId,
      email: email,
      expirationTime: expirationTimeMillis
    }),
    "EX",
    expireInOneDay
  );

  await sendVerificationEmail(email, emailToken);
};
