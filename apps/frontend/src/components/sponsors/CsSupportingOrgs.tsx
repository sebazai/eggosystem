import Image from "next/image";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

export const CsSupportingOrgs = () => {
  return (
    <>
      {/* <Link href={"https://supermetrics.com/"} target="_blank">
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
      </Link> */}
      <Link href={"https://caveentertainment.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/cave.webp")}
          className="w-[100px] h-[27px] sm:w-[200px] sm:h-[54px] mobile-landscape:w-[100px] mobile-landscape:h-[27px]"
          alt="Cave Entertainment"
          width={100}
          height={27}
        />
      </Link>
      {/* <Link href={"https://autoklinikka.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/autoklinikka.png")}
          className="w-[75px] h-[35px] sm:w-[150px] sm:h-[70px] mobile-landscape:w-[75px] mobile-landscape:h-[35px]"
          alt="Autoklinikka"
          width={75}
          height={35}
        />
      </Link> */}
      <Link href={"https://tnnet.fi/"} target="_blank">
        <Image
          src={createNextUrl("/images/sponsors/tnnet.webp")}
          alt="TNNet"
          width={100}
          height={19}
        />
      </Link>
    </>
  );
};
