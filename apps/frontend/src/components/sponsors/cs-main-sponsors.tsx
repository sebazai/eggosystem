import { createNextUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const CsMainSponsors = () => {
  return (
    <Link href={"https://supermetrics.com/"} target="_blank">
      <Image
        src={createNextUrl("/images/sponsors/supermetrics.png")}
        className="w-[150px] h-[23px] landscape:w-[150px] landscape:h-[23px] sm:w-[300px] sm:h-[46px] lg:landscape:w-[300px] lg:landscape:h-[46px]"
        alt="Supermetrics"
        width={150}
        height={89}
      />
    </Link>
  );
};
