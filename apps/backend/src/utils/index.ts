import { type Nullable } from "@eggosystem/types";

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const isValidEmail = (email?: Nullable<string>) => {
  if (!email) return false;
  return emailRegex.test(email);
};
