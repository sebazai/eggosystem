import { createNextUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const CsMainSponsors = () => {
  return (
    <Link href={"https://vilpe.com/"} target="_blank">
      <Image
        src={createNextUrl("/images/sponsors/logo_blue.png")}
        className="w-[131px] h-[37px] sm:w-[262px] sm:h-[75px] mobile-landscape:w-[131px] mobile-landscape:h-[37px]"
        alt="Supermetrics"
        width={150}
        height={89}
      />
    </Link>
  );
};
