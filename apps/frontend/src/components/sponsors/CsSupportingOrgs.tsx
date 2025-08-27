import Image from "next/image";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

export const CsSupportingOrgs = () => {
  return (
    <>
      {/* <Link href={"https://atflow.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/atflow-black.png")}
          className="w-[100px] h-[30px] mobile-landscape:w-[100px] mobile-landscape:h-[30px] sm:w-[200px] sm:h-[59px]"
          alt="Atflow"
          width={200}
          height={59}
        />
      </Link> */}
      <Link href={"https://supermetrics.com/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/supermetrics.png")}
          className="w-[150px] h-[23px] sm:w-[300px] sm:h-[46px] mobile-landscape:w-[150px] mobile-landscape:h-[23px]"
          alt="Supermetrics"
          width={150}
          height={89}
        />
      </Link>
      <Link href={"https://www.vilpe.com/en/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/vilpe.png")}
          className="w-[150px] h-[43px] sm:w-[300px] sm:h-[86px] mobile-landscape:w-[150px] mobile-landscape:h-[43px]"
          alt="Vilpe"
          width={150}
          height={43}
        />
      </Link>
      <Link href={"https://warlockworks.fi/en/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/warlock-works-color.png")}
          className="w-[150px] h-[60px] sm:w-[300px] sm:h-[120px] mobile-landscape:w-[150px] mobile-landscape:h-[60px]"
          alt="Warlock Works"
          width={150}
          height={60}
        />
      </Link>
      <Link href={"https://tnnet.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/tnnet.webp")}
          className="w-[75px] h-[50px] sm:w-[150px] sm:h-[100px]"
          alt="TNNet"
          width={150}
          height={100}
        />
      </Link>
    </>
  );
};
