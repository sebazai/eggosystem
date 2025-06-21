import type { Metadata } from "next";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New Features",
  description: "Check out the latest features we&apos;ve added to the platform"
};

export default function NewFeaturesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-heading font-bold mb-6">New Features</h1>

      <div className="space-y-8">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-4">
            Latest Updates
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Team Page Player Cards 🎮
              </h3>
              <p className="mb-2">
                We&apos;ve enhanced the team pages with improved player cards!
                Now you can see top 5 players in a team, and their key stats.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span>Added:</span>
                <time dateTime="2026-06-25">June 25, 2026</time>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">
                KanaRanks: Player Ranking System 🏆
              </h3>
              <p className="mb-4">
                We&apos;re excited to introduce our new player ranking system -
                KanaRanks! Players are now assigned ranks based on their
                performance, with the top 50 players receiving special
                recognition.
              </p>

              <h4 className="font-bold text-lg mb-2">
                Rank Tiers (Lowest to Highest)
              </h4>
              <div className="mb-6">
                {/* First row: Egg ranks */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/egg3.png")}
                      width={64}
                      height={64}
                      alt="Egg 3"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Egg 3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/egg2.png")}
                      width={64}
                      height={64}
                      alt="Egg 2"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Egg 2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/egg1.png")}
                      width={64}
                      height={64}
                      alt="Egg 1"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Egg 1</span>
                  </div>
                </div>

                {/* Second row: Chic ranks */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chic3.png")}
                      width={64}
                      height={64}
                      alt="Chic 3"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chic 3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chic2.png")}
                      width={64}
                      height={64}
                      alt="Chic 2"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chic 2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chic1.png")}
                      width={64}
                      height={64}
                      alt="Chic 1"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chic 1</span>
                  </div>
                </div>

                {/* Third row: Chicken ranks */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chicken3.png")}
                      width={64}
                      height={64}
                      alt="Chicken 3"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chicken 3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chicken2.png")}
                      width={64}
                      height={64}
                      alt="Chicken 2"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chicken 2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chicken1.png")}
                      width={64}
                      height={64}
                      alt="Chicken 1"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chicken 1</span>
                  </div>
                </div>

                {/* Fourth row: Cock ranks */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/cock3.png")}
                      width={64}
                      height={64}
                      alt="Cock 3"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Cock 3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/cock2.png")}
                      width={64}
                      height={64}
                      alt="Cock 2"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Cock 2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/cock1.png")}
                      width={64}
                      height={64}
                      alt="Cock 1"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Cock 1</span>
                  </div>
                </div>

                {/* TopCock on its own row */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/topcock.png")}
                      width={80}
                      height={80}
                      alt="TopCock"
                      className="mb-2"
                    />
                    <span className="text-sm font-bold text-amber-500">
                      TopCock
                    </span>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-lg mb-2">Top 10 Players</h4>
              <p className="mb-4">
                The top 10 players in our system are granted the prestigious
                &quot;TopCock&quot; rank. These are the most skilled players in
                the system.
              </p>

              <p className="mb-2 text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                <strong>How ranks are calculated:</strong> Ranks are calculated
                at the start of the season with our special &quot;Kanaelo&quot;
                system which is based on various factors and one of those
                factors is how the player performed in the last season of
                Kanaliiga.
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Added:</span>
                <time dateTime="2026-06-20">June 20, 2026</time>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Chicken Announcer 🐔</h3>
              <p className="mb-2">
                We&apos;ve added a friendly chicken that announces new features!
                When you see the chicken walking on your screen, click on it to
                visit this page and learn about our latest updates.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Added:</span>
                <time dateTime="2026-06-20">June 20, 2026</time>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-4">Coming Soon</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Detailed map stats for teams</li>
            <li>More stats for players</li>
            <li>Trophies for teams and players (from earier seasons)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
