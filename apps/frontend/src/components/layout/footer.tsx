import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="border-b border-gray-700 pb-6 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Column 1 - Kanaliiga Ry */}
          <div>
            <h2 className="text-xl font-bold">Kanaliiga Ry</h2>
            <p className="mt-2">Elektronisen urheilun firmaliiga</p>
            <p className="mt-2">
              Ota yhteyttä:{" "}
              <a href="mailto:info@kanaliiga.fi" className="text-blue-400">
                info@kanaliiga.fi
              </a>
            </p>
            <p>Voit ottaa yhteyttä myös Discordissamme</p>
          </div>

          {/* Column 2 - Sponsors */}
          <div>
            <h2 className="text-xl font-bold">Sponsors</h2>
            <div className="mt-4 space-y-2">
              <img
                src="/assets/sponsor-logos/elisa-esports.png"
                alt="Elisa Esports"
                className="h-12"
              />
              <div className="flex space-x-4">
                <img
                  src="/assets/sponsor-logos/polar_squad.png"
                  alt="Polar Squad"
                  className="h-12"
                />
                <img
                  src="/assets/sponsor-logos/tnnet.png"
                  alt="TNNet"
                  className="h-12"
                />
              </div>
              <img
                src="/assets/sponsor-logos/atflow.png"
                alt="Atflow"
                className="h-12"
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
                  link: "https://www.youtube.com/channel/UC0n_aasCpmXudfu4Rm8eAjQ",
                },
                { name: "Twitch", link: "https://www.twitch.tv/KanaliigaTV" },
                {
                  name: "Facebook",
                  link: "https://www.facebook.com/Kanaliiga/",
                },
                { name: "Twitter", link: "https://twitter.com/Kanaliiga" },
                {
                  name: "LinkedIn",
                  link: "https://www.linkedin.com/company/Kanaliiga",
                },
                { name: "Instagram", link: "http://instagram.com/Kanaliiga" },
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
              <p>Created by</p>
              <p>Powered by</p>
              <div className="flex space-x-4 mt-2">
                <Link href="https://www.fellowmind.fi/" target="_blank">
                  <img
                    src="/assets/fellowmind-logo-large.png"
                    alt="Fellowmind"
                    className="h-12"
                  />
                </Link>
                <Link
                  href="https://www.qlik.com/us/products/qlik-sense"
                  target="_blank"
                >
                  <img
                    src="/assets/qlik-logo.png"
                    alt="Qlik"
                    className="h-12"
                  />
                </Link>
              </div>
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

        {/* Copyright */}
        <div className="text-center text-sm text-gray-400 mt-6">
          <p>© 2018 - 2021 Kanaliiga Ry / stats.kanaliiga.fi</p>
          <p>Kaikki oikeudet pidätetään.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
