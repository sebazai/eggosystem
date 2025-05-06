import { createNextUrl } from "@/lib/utils";
import Image from "next/image";

export const FooterSponsors = () => {
  return (
    <div>
      <h2>Sponsors</h2>
      <div className="mt-4 space-y-6 flex flex-col items-center md:items-start lg:items-center dark:invert-0 invert">
        <Image
          src={createNextUrl("/images/sponsors/elisa-esports-footer.png")}
          alt="Elisa Esports"
          width={200}
          height={119}
        />

        <Image
          src={createNextUrl("/images/sponsors/tnnet-footer.png")}
          alt="TNNet"
          width={100}
          height={19}
        />

        <Image
          src={createNextUrl("/images/sponsors/atflow-footer.png")}
          alt="Atflow"
          width={120}
          height={30}
        />
      </div>
    </div>
  );
};
