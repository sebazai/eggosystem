import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-gray-700 pb-6 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h2 className="text-xl font-bold">Kanaliiga Ry</h2>
            <p className="mt-2">Elektronisen urheilun firmaliiga</p>
            <p className="mt-2">
              Contact us:{" "}
              <a href="mailto:info@kanaliiga.fi" className="text-blue-400">
                info@kanaliiga.fi
              </a>
            </p>
            <p>You can reach us on Discord</p>
          </div>

          {/* Column 2 - Sponsors */}
          <div>
            <h2 className="text-xl font-bold">Sponsors</h2>
            <div className="mt-4 space-y-2">
              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/elisa-esports.png"
                alt="Elisa Esports"
                width={200}
                height={50}
              />

              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/polar_squad.png"
                alt="Polar Squad"
                width={200}
                height={50}
              />
              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/tnnet.png"
                alt="TNNet"
                width={200}
                height={50}
              />

              <Image
                src="https://stats.kanaliiga.fi/cs/assets/sponsor-logos/atflow.png"
                alt="Atflow"
                width={200}
                height={50}
              />
            </div>
          </div>

          {/* Column 3 - Follow Us */}
          <div>
            <h2 className="text-xl font-bold">Follow us</h2>
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
                <a
                  key={social.name}
                  href={social.link}
                  className="block text-blue-400 hover:underline"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Column 4 - Credits */}
          <div>
            <h2 className="text-xl font-bold">Credits</h2>
            <div className="mt-4">
              <p>
                Created by{" "}
                <a
                  href="https://www.linkedin.com/in/jari-haikonen/"
                  className="text-blue-400"
                >
                  enzoj
                </a>
              </p>
              <p>
                Powered by{" "}
                <a
                  href="https://www.linkedin.com/in/jari-haikonen/"
                  className="text-blue-400"
                >
                  enzoj
                </a>
              </p>
              <p className="mt-2">
                Data mining by{" "}
                <a
                  href="https://www.linkedin.com/in/jari-haikonen/"
                  className="text-blue-400"
                >
                  enzoj
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-6">
          <p>Kanaliiga Ry / hub.kanaliiga.fi</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
