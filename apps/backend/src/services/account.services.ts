import { expireIn7Days, redisClient } from "../utils/redisClient";
import { sendVerificationEmail } from "./email.services";

export const handleEmailVerification = async (
  accountId: number,
  email: string,
  emailToken: string,
  expirationTimeMillis: number
) => {
  const redisKey = `verify:work-email:${emailToken}`;
  await redisClient.set(
    redisKey,
    JSON.stringify({
      accountId,
      email: email,
      expirationTime: expirationTimeMillis
    }),
    "EX",
    expireIn7Days
  );

  await sendVerificationEmail(email, emailToken);
};
