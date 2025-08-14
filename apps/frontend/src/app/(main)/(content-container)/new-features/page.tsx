import type { Metadata } from "next";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "New Features",
  description: "Check out the latest features we&apos;ve added to the platform"
};

export default function NewFeaturesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-heading font-bold mb-6">New Features</h1>

      <div className="space-y-8">
        {/* July 1, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">July 1, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Kanahautomo: Find Your Gaming Squad 🎮
              </h3>
              <p className="mb-2">
                Introducing Kanahautomo, our new teammate finder system! Connect
                with players from your company and join dedicated Discord
                channels for competitive gaming.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Company-Based Matching</span> -
                  Connect with colleagues and teammates from your company
                </li>
                <li>
                  <span className="font-medium">Multi-Game Support</span> - Find
                  teammates for CS2 (Competitive & Wingman), PUBG (Duo & Squad),
                  Rocket League, and Dota 2
                </li>
                <li>
                  <span className="font-medium">Discord Integration</span> -
                  Automatically join game-specific Discord channels with proper
                  roles
                </li>
                <li>
                  <span className="font-medium">Company Management</span> - Join
                  existing companies or create new ones for your organization
                </li>
                <li>
                  <span className="font-medium">Registration Dashboard</span> -
                  View how many players from each company have joined
                </li>
              </ul>

              <h4 className="font-bold text-lg mb-2">How It Works</h4>
              <ol className="list-decimal pl-5 mb-3">
                <li>Select your company (or create a new one)</li>
                <li>Choose which games you want to play</li>
                <li>Link your Discord account for automatic role assignment</li>
                <li>
                  Accept terms for visibility within the Discord community
                </li>
                <li>
                  Receive a Discord invite via email to join your gaming
                  community
                </li>
                <li>
                  Start playing with your co-workers straight away - just handle
                  the communication on the channel and start playing together
                  for fun!
                </li>
              </ol>

              <p className="mb-2">
                Perfect for companies who want to organize their employees and
                help them find teammates for both casual and competitive
                matches! No need to wait - once you&apos;re in the Discord
                channels, you can immediately start coordinating games with your
                colleagues.
              </p>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Visit the new
                <a
                  href="/kanahautomo"
                  className="text-kanaliiga-orange hover:underline ml-1"
                >
                  Kanahautomo page
                </a>{" "}
                to register and find your gaming squad!
              </div>
            </div>
          </div>
        </section>

        {/* June 22, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">June 22, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Player Skill Metrics Diagram 📊
              </h3>
              <p className="mb-2">
                We&apos;ve added a comprehensive skill metrics diagram for
                players! This new visualization breaks down player performance
                into five key areas:
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Aim</span> - Mechanical skills
                  including headshot percentage and accuracy
                </li>
                <li>
                  <span className="font-medium">Impact</span> - Influence on
                  round outcomes including clutches and multi-kills
                </li>
                <li>
                  <span className="font-medium">Positioning</span> - Tactical
                  awareness including opening duels and survival
                </li>
                <li>
                  <span className="font-medium">Utility</span> - Grenade and
                  flash effectiveness
                </li>
                <li>
                  <span className="font-medium">Consistency</span> - Performance
                  stability across maps and sides
                </li>
              </ul>
              <p className="mb-2">
                You can also compare a player&apos;s skills with their team
                average, players of similar rank, or the entire player base.
              </p>
              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Go to any player&apos;s
                profile page and click on the &quot;Skills&quot; tab.
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Map Statistics 🗺️</h3>
              <p className="mb-2">
                We&apos;ve launched detailed map statistics for both teams and
                players! Now you can:
              </p>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  View performance breakdowns by map for teams and individual
                  players
                </li>
                <li>
                  See win rates, round distributions, and key statistics for
                  each map
                </li>
                <li>
                  Compare performance across different maps to identify
                  strengths and weaknesses
                </li>
                <li>
                  Filter map statistics by season, league, and other parameters
                </li>
              </ul>
              <p className="mb-2">
                This feature helps teams identify which maps they should focus
                on practicing and gives players insights into their map-specific
                performance.
              </p>
              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong>
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    For players: Visit a player&apos;s profile and click on the
                    &quot;Map Statistics&quot; tab
                  </li>
                  <li>
                    For teams: Go to a team&apos;s page and and click on the
                    &quot;Map Statistics&quot; tab
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* June 20, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">June 20, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Team Page Player Cards 🎮
              </h3>
              <p className="mb-2">
                We&apos;ve enhanced the team pages with improved player cards!
                Now you can see top 5 players in a team, and their key stats.
              </p>
              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Visit any team page to see
                the new player cards with enhanced statistics.
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
                      src={createNextUrl("/images/ranks/chick3.png")}
                      width={64}
                      height={64}
                      alt="Chick 3"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chick 3</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chick2.png")}
                      width={64}
                      height={64}
                      alt="Chick 2"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chick 2</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Image
                      src={createNextUrl("/images/ranks/chick1.png")}
                      width={64}
                      height={64}
                      alt="Chick 1"
                      className="mb-2"
                    />
                    <span className="text-sm font-semibold">Chick 1</span>
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

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Player ranks are displayed on
                player profile pages, leaderboards, and in team rosters.
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Chicken Announcer 🐔</h3>
              <p className="mb-2">
                We&apos;ve added a friendly chicken that announces new features!
                When you see the chicken walking on your screen, click on it to
                visit this page and learn about our latest updates.
              </p>
              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> The chicken will occasionally
                appear at the bottom of your screen while browsing the site.
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-4">Coming Soon</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Trophies for teams and players (from earlier seasons)</li>
            <li>CT/T side statistics from match to players</li>
            <li>Trade information from match</li>
            <li>Upcoming match information page</li>
            <li>Match calendar with filters</li>
            <li>Team management dashboard for captains</li>
            <li>Historical data visualization with interactive charts</li>
            <li>Team calendar doodle for scheduling matches with opponents</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
