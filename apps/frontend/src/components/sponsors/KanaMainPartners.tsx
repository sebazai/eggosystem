import Image from "next/image";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

export const KanaMainPartners = () => {
  return (
    <>
      {/* <Link href={"https://elisaesports.com/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/elisa-esports-black.png")}
          className="w-[75px] h-[44px] mobile-landscape:w-[75px] mobile-landscape:h-[44px] sm:w-[150px] sm:h-[89px]"
          alt="Elisa Esports"
          width={150}
          height={89}
        />
      </Link>
      <Link href={"https://www.visma.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/visma-black.png")}
          className="w-[110px] h-[20px] mobile-landscape:w-[110px] mobile-landscape:h-[20px] sm:w-[220px] sm:h-[41px]"
          alt="Visma"
          width={220}
          height={41}
        />
      </Link> */}

      <Link href={"https://atflow.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/atflow.webp")}
          className="w-[97px] h-[25px] mobile-landscape:w-[97px] mobile-landscape:h-[25px] sm:w-[194px] sm:h-[49px]"
          alt="Atflow"
          width={194}
          height={49}
        />
      </Link>
    </>
  );
};
