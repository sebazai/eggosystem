import Link from "next/link";
import Image from "next/image";
import { FooterPartners } from "../sponsors/FooterPartners";
import { createNextUrl } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { getPublicMarketingSponsors } from "@/lib/get-public-marketing-sponsors";

const Footer = async () => {
  const sponsors = await getPublicMarketingSponsors();
  const footerPartnersWithLogo = sponsors.main_partners.filter(
    (p) =>
      p.footer_image_phash != null && p.footer_image_phash.trim().length > 0
  );
  // Get Git SHA from environment variables
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA || "";
  const gitlabUrl =
    process.env.NEXT_PUBLIC_GITLAB_URL ||
    "https://gitlab.com/kanaliiga_public/kanahub/eggosystem";

  // Format Git SHA to show only first 7 characters
  const shortSha = gitSha.substring(0, 7);

  return (
    <footer className="bg-secondary pt-4 sm:pt-12 px-4 sm:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <div className="border-b border-gray-700 pb-6 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h2>Kanaliiga Ry</h2>
            <p className="mt-2">Elektronisen urheilun firmaliiga</p>
            <p className="mt-2">
              Contact us:{" "}
              <Link href="mailto:info@kanaliiga.fi">info@kanaliiga.fi</Link>
            </p>
            <p>
              You can reach us on{" "}
              <Link href="https://discord.gg/nhrNC9x">Discord</Link>
            </p>
          </div>

          {/* Column 2 — main partners only if they uploaded a footer-specific logo */}
          {footerPartnersWithLogo.length > 0 ? (
            <FooterPartners partners={footerPartnersWithLogo} />
          ) : (
            <div aria-hidden="true" />
          )}

          {/* Column 3 - Follow Us */}
          <div>
            <h2>Follow us</h2>
            <div className="mt-4 space-y-2">
              {[
                { name: "Discord", link: "https://discord.gg/nhrNC9x" },
                {
                  name: "YouTube",
                  link: "https://www.youtube.com/channel/UC0n_aasCpmXudfu4Rm8eAjQ"
                },
                { name: "Twitch", link: "https://www.twitch.tv/KanaliigaTV" },
                {
                  name: "Facebook",
                  link: "https://www.facebook.com/Kanaliiga/"
                },
                { name: "Twitter", link: "https://twitter.com/Kanaliiga" },
                {
                  name: "LinkedIn",
                  link: "https://www.linkedin.com/company/Kanaliiga"
                },
                { name: "Instagram", link: "http://instagram.com/Kanaliiga" }
              ].map((social) => (
                <Link key={social.name} href={social.link} className="block">
                  {social.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2>Credits</h2>
            <div className="mt-4">
              <b>Created by:</b>
              <div>
                <Link href="https://www.linkedin.com/in/jari-haikonen/">
                  enzoj
                </Link>
                {" & "}
                <Link href="https://www.linkedin.com/in/sebastian-sergelius/">
                  sububobi
                </Link>
                {" & "}
                <Link href="https://www.linkedin.com/in/mika-schroderus/">
                  Xynte
                </Link>
                <div className="font-sm">
                  and other{" "}
                  <Link href="https://gitlab.com/kanaliiga_public/kanahub/eggosystem/-/graphs/main?ref_type=heads">
                    contributors
                  </Link>
                </div>
              </div>
              <div className="my-3">
                <b>Data mining by:</b>{" "}
                <Link href="https://www.linkedin.com/in/jari-haikonen/">
                  enzoj
                </Link>
              </div>
              <Separator />
              <div className="mt-2 flex flex-row items-center gap-3">
                <Link
                  href="https://www.wunderdog.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Image
                    src={createNextUrl(
                      "/images/sponsors/wunderdog_oy_logo.jpeg"
                    )}
                    alt="Wunderdog"
                    width={100}
                    height={100}
                    className="dark:invert-0 invert"
                    unoptimized
                  />
                </Link>
                <p className="text-sm text-muted-foreground">
                  Developed with support from{" "}
                  <Link
                    href="https://www.wunderdog.io/blog/open-source-benefit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Wunderdog&apos;s open-source program
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>Kanaliiga Ry / hub.kanaliiga.fi</p>
          <p>
            Source:{" "}
            <Link
              href={"https://gitlab.com/kanaliiga_public/kanahub/eggosystem"}
            >
              Gitlab
            </Link>
            {shortSha && (
              <>
                <br />
                Current build: <Link href={gitlabUrl}>{shortSha}</Link>
              </>
            )}
          </p>
          <div className="flex flex-row gap-2 justify-center pb-2">
            <Link href={"/privacy-policy"}>Privacy Policy</Link> |
            <Link href={"/new-features"}>Changelog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
