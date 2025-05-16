import fs from "fs/promises";
import path from "path";

export const teamLogoExists = async (teamLogoPath: string) => {
  const fullPath = path.join(process.cwd(), "public", teamLogoPath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};
