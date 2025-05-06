import Image from "next/image";
import { createNextUrl } from "@/lib/utils";

export const KanaMainPartners = () => {
  return (
    <>
      <Image
        src={createNextUrl("/images/sponsors/elisa-esports-black.png")}
        className="w-[75px] h-[44px] sm:w-[150px] sm:h-[89px]"
        alt="Elisa esports"
        width={150}
        height={89}
      />
      <Image
        src={createNextUrl("/images/sponsors/visma-black.png")}
        className="w-[110px] h-[20px] sm:w-[220px] sm:h-[41px]"
        alt="Visma"
        width={220}
        height={41}
      />
      <Image
        src={createNextUrl("/images/sponsors/atflow-black.png")}
        className="w-[100px] h-[30px] sm:w-[200px] sm:h-[59px]"
        alt="Atflow"
        width={200}
        height={59}
      />
    </>
  );
};
