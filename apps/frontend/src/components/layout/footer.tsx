import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-secondary py-8 px-4">
      <div className="max-w-7xl mx-auto">
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

          {/* Column 2 - Sponsors */}
          <div>
            <h2>Sponsors</h2>
            <div className="mt-4 space-y-6 flex flex-col items-center md:items-start lg:items-center dark:invert-0 invert">
              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/elisa-esports.png"
                alt="Elisa Esports"
                width={200}
                height={100}
              />

              <div className="flex space-x-6">
                <Image
                  src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/polar_squad.png"
                  alt="Polar Squad"
                  width={100}
                  height={50}
                />
                <Image
                  src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/tnnet.png"
                  alt="TNNet"
                  width={100}
                  height={50}
                />
              </div>

              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/atflow.png"
                alt="Atflow"
                width={100}
                height={50}
              />
            </div>
          </div>

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
              <p>Created by:</p>
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

              <div className="mt-4">
                <p>Data mining by:</p>
                <Link href="https://www.linkedin.com/in/jari-haikonen/">
                  enzoj
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-6">
          <p>Kanaliiga Ry / hub.kanaliiga.fi</p>
          <p>
            Source:{" "}
            <Link
              href={"https://gitlab.com/kanaliiga_public/kanahub/eggosystem"}
            >
              Gitlab
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
