import { createNextUrl } from "@/lib/utils";
import Image from "next/image";

export const FaceITLevelIcon = ({ level }: { level: number }) => {
  if (level === -1) {
    return null;
  }
  return (
    <Image
      alt={`FaceIT level ${level}`}
      src={createNextUrl(`/images/faceit/faceit${level}.svg`)}
      width={30}
      height={30}
    />
  );
};
