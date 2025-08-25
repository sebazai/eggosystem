import { createNextUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const FooterPartners = () => {
  return (
    <div>
      <h2>Partners</h2>
      <div className="mt-4 space-y-6 sm:space-y-8 flex flex-col items-start dark:invert-0 invert">
        <Link href={"https://elisaesports.com/"} target="_blank">
          <Image
            src={createNextUrl("/images/sponsors/elisa-esports-footer.png")}
            alt="Elisa Esports"
            width={200}
            height={119}
          />
        </Link>

        <Link href={"https://www.visma.com/"} target="_blank">
          <Image
            src={createNextUrl("/images/sponsors/visma_logo_footer.png")}
            alt="Visma"
            width={181}
            height={34}
          />
        </Link>

        <Link href={"https://tnnet.fi/"} target="_blank">
          <Image
            src={createNextUrl("/images/sponsors/tnnet-footer.png")}
            alt="TNNet"
            width={100}
            height={19}
          />
        </Link>
      </div>
    </div>
  );
};
