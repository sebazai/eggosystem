import Image from "next/image";
import { createNextUrl } from "@/lib/utils";

export const CsSupportingOrgs = () => {
  return (
    <>
      <Image
        src={createNextUrl("/images/sponsors/tnnet.webp")}
        className="w-[75px] h-[50px] sm:w-[150px] sm:h-[100px]"
        alt="TNNet"
        width={150}
        height={100}
      />
      <Image
        src={createNextUrl("/images/sponsors/autoklinikka.png")}
        className="w-[75px] h-[33px] sm:w-[150px] sm:h-[66px]"
        alt="Autoklinikka"
        width={150}
        height={66}
      />
    </>
  );
};
