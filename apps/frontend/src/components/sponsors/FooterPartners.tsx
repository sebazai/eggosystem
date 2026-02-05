import { createNextUrl } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export const FooterPartners = () => {
  return (
    <div>
      <h2>Partners</h2>
      <div className="mt-4 space-y-6 sm:space-y-8 flex flex-col items-start dark:invert-0 invert">
        <Link href={"https://atflow.fi/"} target="_blank">
          <Image
            src={createNextUrl("/images/sponsors/atflow-footer.png")}
            alt="Atflow"
            width={175}
            height={44}
          />
        </Link>
      </div>
    </div>
  );
};
