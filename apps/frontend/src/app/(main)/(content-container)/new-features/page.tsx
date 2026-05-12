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
        {/* December 22, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">December 22, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  Enhanced Map Statistics Rework 🗺️
                </h3>
                <p className="mb-2">
                  We&apos;ve completely reworked the map statistics interface
                  for both teams and players, providing better organization and
                  deeper insights into map-specific performance.
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">Tabbed Interface</span> - New
                    organized categories for easier navigation
                  </li>
                  <li>
                    <span className="font-medium">Player Map Stats</span> -
                    Organized into Combat, Trading, Utility, Positioning, and
                    Openings tabs
                  </li>
                  <li>
                    <span className="font-medium">Team Map Stats</span> -
                    Organized into General, Plant & Retake, Trading, and
                    Openings & Advantage tabs
                  </li>
                  <li>
                    <span className="font-medium">Enhanced Visualization</span>{" "}
                    - Better visual representation of statistics with improved
                    cards and progress bars
                  </li>
                  <li>
                    <span className="font-medium">Better Organization</span> -
                    Related statistics grouped together for easier analysis
                  </li>
                </ul>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Visit any player or team
                  page and click on the &quot;Map Statistics&quot; tab to see
                  the new organized interface.
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  📊 First Death Trade Analysis
                </h3>
                <p className="mb-2">
                  We&apos;ve added detailed first death trade analysis for
                  players, helping you understand how well players are
                  positioned and how often their deaths result in successful
                  trades.
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">Trade Breakdown</span> - See
                    traded, not traded, and isolated first deaths
                  </li>
                  <li>
                    <span className="font-medium">Side-Specific Analysis</span>{" "}
                    - Separate breakdowns for T-side and CT-side performance
                  </li>
                  <li>
                    <span className="font-medium">Tradeable Deaths</span> -
                    Track how many first deaths had potential for trades (where
                    teammates could see the death)
                  </li>
                  <li>
                    <span className="font-medium">Isolated Deaths</span> -
                    Identify deaths where no trade was possible (no teammates
                    nearby)
                  </li>
                  <li>
                    <span className="font-medium">Summary View</span> - Overall
                    statistics with side-specific breakdowns that sum correctly
                  </li>
                </ul>

                <p className="mb-2">
                  This analysis helps identify players who position themselves
                  well for trades, as well as those who may be taking isolated
                  fights that don&apos;t benefit the team.
                </p>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Go to any player&apos;s
                  profile page, click on &quot;Map Statistics&quot;, select a
                  map, and then navigate to the &quot;Openings&quot; tab. The
                  First Death Analysis section shows the detailed breakdown.
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  5v4 and 4v5 Advantage Round Statistics ⚔️
                </h3>
                <p className="mb-2">
                  We&apos;ve added win percentage statistics for advantage
                  rounds, showing how well teams capitalize on man-advantage
                  situations (5v4) and how they perform when at a disadvantage
                  (4v5).
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">5v4 Win Rate</span> - See how
                    often teams win rounds when they have a man advantage
                  </li>
                  <li>
                    <span className="font-medium">4v5 Win Rate</span> - Track
                    how well teams perform when playing at a disadvantage
                  </li>
                  <li>
                    <span className="font-medium">Side-Specific Breakdown</span>{" "}
                    - Separate statistics for T-side and CT-side advantage
                    situations
                  </li>
                  <li>
                    <span className="font-medium">Visual Progress Bars</span> -
                    Easy-to-read visual representation of win rates
                  </li>
                  <li>
                    <span className="font-medium">Overall & Side Stats</span> -
                    Both overall and side-specific statistics for comprehensive
                    analysis
                  </li>
                </ul>

                <p className="mb-2">
                  These statistics are critical for understanding tactical
                  execution and round conversion. Teams with high 5v4 win rates
                  capitalize well on advantages, while high 4v5 win rates show
                  strong clutch potential.
                </p>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Go to any
                  team&apos;s/players page, click on &quot;Map Statistics&quot;,
                  select a map, and navigate to the &quot;Openings &
                  Advantage&quot; tab. The Advantage Rounds section shows 5v4
                  and 4v5 win rates with side-specific breakdowns.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* December 6, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">December 6, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">🏆 Trophy System</h3>
                <p className="mb-2">
                  We&apos;re excited to introduce the Trophy System! Players and
                  teams can now earn and display trophies for their achievements
                  in Kanaliiga.
                </p>

                <h4 className="font-bold text-lg mb-2">Trophy Types</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">Season Placement</span> -
                    Gold, Silver, and Bronze trophies for 1st, 2nd, and 3rd
                    place finishes in any division
                  </li>
                  <li>
                    <span className="font-medium">Kanarating Champions</span> -
                    Top 3 players with the highest Kanarating in each division
                    per season earn special MKP (Most Kana Player) trophies
                  </li>
                </ul>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    Trophies are automatically awarded based on historical data
                    across all seasons
                  </li>
                  <li>
                    Players inherit team trophies from seasons where they were
                    primary roster members
                  </li>
                  <li>
                    Each trophy displays the season number for easy
                    identification
                  </li>
                  <li>
                    Hover over any trophy to see the full details including
                    division and season name
                  </li>
                </ul>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Trophies appear on both
                  player profile pages and team pages. Look for the
                  &quot;Trophies&quot; section to see all earned awards.
                </div>
              </div>

              <div className="md:w-2/5">
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Season Placement Trophies
                    </p>
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/cdc33b3c160c3b1e"
                        width={64}
                        height={64}
                        alt="Gold Trophy"
                        className="rounded-lg"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/cdc33b38065c3b4e"
                        width={64}
                        height={64}
                        alt="Silver Trophy"
                        className="rounded-lg"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/cfc3323c360c3b1e"
                        width={64}
                        height={64}
                        alt="Bronze Trophy"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Kanarating (MKP) Trophies
                    </p>
                    <div className="flex gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/96b067e73c69491a"
                        width={64}
                        height={64}
                        alt="MKP Gold"
                        className="rounded-lg"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/95b4674e58435b9a"
                        width={64}
                        height={64}
                        alt="MKP Silver"
                        className="rounded-lg"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://img.kanaliiga.fi/images/by-hash/phash/909771634f78499b"
                        width={64}
                        height={64}
                        alt="MKP Bronze"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* December 8, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">December 8, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  Map Picks & Bans Spider Chart 🕸️
                </h3>
                <p className="mb-2">
                  Teams now have a new spider chart visualization showing their
                  map picks and bans history! This helps you quickly understand
                  a team&apos;s map preferences and avoid patterns.
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">Dual Radar Lines</span> -
                    Picks shown in blue (solid), bans shown in orange (dashed)
                    for easy visual distinction
                  </li>
                  <li>
                    <span className="font-medium">Accessibility First</span> -
                    Colorblind-friendly blue/orange palette with pattern
                    differentiation (dashed lines for bans)
                  </li>
                  <li>
                    <span className="font-medium">Filter Compatible</span> -
                    Works with season, league, and stage filters to see
                    historical trends
                  </li>
                  <li>
                    <span className="font-medium">Side-by-Side View</span> -
                    Displayed next to the existing Map Performance radar for
                    comprehensive analysis
                  </li>
                </ul>

                <p className="mb-2">
                  Use this to scout opponents&apos; map preferences before
                  matches, or analyze your own team&apos;s tendencies to
                  diversify your map pool strategy!
                </p>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Go to any team&apos;s page
                  and click on the &quot;Map Statistics&quot; tab. The new chart
                  appears on the right side next to the Map Performance radar.
                </div>
              </div>

              <div className="md:w-2/5">
                <Image
                  src={createNextUrl("/images/features/pickbans-preview.png")}
                  width={600}
                  height={350}
                  alt="Map Picks & Bans Spider Chart Preview"
                  className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* November 24, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">November 24, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">🏆 Fantasy League</h3>
                <p className="mb-2">
                  We&apos;re excited to introduce Fantasy League - a seasonal
                  competition where you can create your own team by drafting
                  real Kanaliiga players and earn points based on their
                  performance in actual matches!
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">Team Drafting</span> - Build a
                    5-player roster with a $1,000,000 budget constraint
                  </li>
                  <li>
                    <span className="font-medium">Player Tiers</span> - Players
                    are categorized as Bronze, Silver, or Gold based on their
                    performance and value
                  </li>
                  <li>
                    <span className="font-medium">Dynamic Pricing</span> -
                    Player values update throughout the season based on their
                    match performance
                  </li>
                  <li>
                    <span className="font-medium">Role Assignments</span> -
                    Assign specialized roles to players (18 different roles
                    available) to maximize points through role-specific bonuses
                  </li>
                  <li>
                    <span className="font-medium">Points System</span> - Earn
                    points from kills, assists, clutches, multi-kills, and
                    performance bonuses
                  </li>
                  <li>
                    <span className="font-medium">Team Management</span> - Make
                    substitutions and swap player roles (with weekly limits)
                  </li>
                  <li>
                    <span className="font-medium">Leaderboards</span> - Compete
                    with other fantasy teams and see your ranking
                  </li>
                  <li>
                    <span className="font-medium">Price History</span> - Track
                    how player values change over time throughout the season
                  </li>
                </ul>

                <p className="mb-2">
                  Each season has its own independent fantasy league, and you
                  can only draft players from the specific division you choose.
                  Perfect for testing your knowledge of player performance and
                  competing with friends!
                </p>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Navigate to any season page
                  and click on &quot;Fantasy League&quot; in the season
                  navigation menu. You can create your team, view the
                  leaderboard, check top players, and track price history.
                </div>
              </div>

              <div className="md:w-2/5">
                <Image
                  src={createNextUrl(
                    "/images/features/fantasy-league-preview.png"
                  )}
                  width={600}
                  height={350}
                  alt="Fantasy League Preview"
                  className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* November 9, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">November 9, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Your Teams</h3>
              <p className="mb-2">
                We&apos;ve added a new &quot;My Teams&quot; page where you can
                quickly access all the teams you&apos;re part of. This
                centralized hub makes it easy to stay updated on your
                team&apos;s activities.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>View all teams you&apos;re a member of in one place</li>
                <li>
                  See upcoming matches for your teams with dates and opponents
                </li>
                <li>Quick access to team management and details</li>
                <li>Direct links to FaceIT matchrooms for scheduled matches</li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Click on your profile menu
                and select &quot;My Teams&quot;. You&apos;ll need to be logged
                in to view your teams.
              </div>
            </div>
          </div>
        </section>

        {/* November 8, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">November 8, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                🎮 2D Viewer Enhancements
              </h3>
              <p className="mb-2">
                We&apos;ve made significant improvements to the 2D match viewer
                to provide a better experience when analyzing matches.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Flash Duration</span> -
                  Visualize flashbang effects and their duration on the map
                </li>
                <li>
                  <span className="font-medium">Dynamic Molotov Burns</span> -
                  See molotov fire spread and burn effects in real-time
                </li>
                <li>
                  <span className="font-medium">Round Timer</span> - Fixed and
                  improved round timer display
                </li>
                <li>
                  <span className="font-medium">Grenade Trajectories</span> -
                  Visualize grenade flight paths for better tactical analysis
                </li>
                <li>
                  <span className="font-medium">Weapon Names</span> - Improved
                  weapon name display and accuracy
                </li>
                <li>
                  <span className="font-medium">Mobile View</span> - Enhanced
                  mobile experience with better responsive design
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> These improvements are
                available in the 2D viewer when viewing any match. Click on a
                match and navigate to the 2D viewer tab.
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">
                Discord Account Linking
              </h3>
              <p className="mb-2">
                You can now link your Discord account directly from your profile
                settings, making it easier to connect with the community and
                participate in team communications.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>Link your Discord account from your profile page</li>
                <li>
                  Updated signup process - Discord is now optional during
                  registration
                </li>
                <li>
                  Discord username is no longer required in the signup form
                </li>
                <li>
                  Manage your Discord connection anytime from your profile
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Go to your profile page and
                look for the Discord settings section. You can link or unlink
                your Discord account there.
              </div>
            </div>
          </div>
        </section>

        {/* November 1, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">November 1, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Enhanced Steam ID Input 🔢
              </h3>
              <p className="mb-2">
                We&apos;ve improved the Steam ID input system to support
                multiple formats, making it easier to add players and link
                accounts.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Multiple Formats</span> -
                  Support for Steam Community URLs, Steam ID, Steam ID3, and
                  other formats
                </li>
                <li>
                  <span className="font-medium">Better Validation</span> -
                  Improved Steam ID validation and automatic conversion between
                  formats
                </li>
                <li>
                  <span className="font-medium">FaceIT Integration</span> -
                  FaceIT nickname and ID are now automatically saved during
                  signup
                </li>
                <li>
                  <span className="font-medium">User-Friendly</span> - You can
                  paste Steam Community URLs directly without manual conversion
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> This improvement is available
                in the signup form when adding players, and in the admin
                dashboard when adding or validating players.
              </div>
            </div>
          </div>
        </section>

        {/* September 11, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">September 11, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">FaceIT Integration</h3>
              <p className="mb-2">
                We&apos;ve added FaceIT profile links throughout the platform,
                making it easier to access player and team FaceIT profiles.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Player Profiles</span> - Direct
                  links to FaceIT profiles on player pages
                </li>
                <li>
                  <span className="font-medium">Team Pages</span> - FaceIT links
                  available on team pages
                </li>
                <li>
                  <span className="font-medium">Matchroom Links</span> - Quick
                  access to FaceIT matchrooms from upcoming match pages
                </li>
                <li>
                  <span className="font-medium">Universal Data</span> - Improved
                  FaceIT data fetching system for better integration
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Look for FaceIT icons and
                links on player profile pages, team pages, and upcoming match
                pages.
              </div>
            </div>
          </div>
        </section>

        {/* September 4, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">September 4, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                📊 CT/T Side Statistics
              </h3>
              <p className="mb-2">
                We&apos;ve added separate statistics for Counter-Terrorist (CT)
                and Terrorist (T) sides, giving you deeper insights into player
                and team performance on each side.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  View side-specific performance breakdowns in match statistics
                </li>
                <li>Compare how players perform on CT side vs T side</li>
                <li>
                  Enhanced player statistics showing CT/T performance separately
                </li>
                <li>
                  Better understanding of team strengths and weaknesses on each
                  side
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Available in match statistics
                and player statistics throughout the platform. Look for CT/T
                breakdowns in match and game stats.
              </div>
            </div>
          </div>
        </section>

        {/* September 1, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">September 1, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Substitute Players System
              </h3>
              <p className="mb-2">
                Team captains and admins can now add substitute players for
                individual matches or for the entire season, providing more
                flexibility in team management.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Match-Specific Subs</span> - Add
                  substitute players for individual matches
                </li>
                <li>
                  <span className="font-medium">Season Subs</span> - Add
                  substitute players for the entire season
                </li>
                <li>
                  <span className="font-medium">Admin Dashboard</span> - Manage
                  substitutes through the admin dashboard
                </li>
                <li>
                  <span className="font-medium">Flexible Management</span> -
                  Easy to add, remove, and manage substitute players
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Team captains and admins can
                access the substitute player management through the admin
                dashboard under the players section.
              </div>
            </div>
          </div>
        </section>

        {/* October 18, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">October 18, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  2D Match Viewer Integration 🗺️
                </h3>
                <p className="mb-2">
                  We&apos;ve integrated a powerful 2D match viewer that provides
                  interactive visualization of matches, allowing you to analyze
                  gameplay from a top-down perspective.
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>
                    <span className="font-medium">
                      Interactive Visualization
                    </span>{" "}
                    - View matches from a 2D top-down perspective
                  </li>
                  <li>
                    <span className="font-medium">Player Positions</span> - See
                    player positions and movements throughout rounds
                  </li>
                  <li>
                    <span className="font-medium">Weapon Icons</span> - Visual
                    representation of weapons and equipment
                  </li>
                  <li>
                    <span className="font-medium">Kill Markers</span> - Track
                    kills and events on the map
                  </li>
                  <li>
                    <span className="font-medium">Round-by-Round</span> -
                    Navigate through rounds to see how strategies unfold
                  </li>
                </ul>

                <p className="mb-2">
                  This tool is perfect for teams and analysts who want to study
                  tactics, positioning, and round strategies in detail.
                </p>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Available when viewing
                  match details. Look for the 2D viewer option in match pages.
                </div>
              </div>

              <div className="md:w-2/5">
                <Image
                  src={createNextUrl("/images/features/2d-viewer-preview.png")}
                  width={600}
                  height={350}
                  alt="2D Viewer Preview"
                  className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* August 18, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">August 18, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Upcoming Matches Page 📅
              </h3>
              <p className="mb-2">
                We&apos;ve created a comprehensive upcoming matches page that
                provides detailed previews and analysis before matches begin.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>
                  <span className="font-medium">Team Form Comparison</span> -
                  Compare recent performance and form of both teams
                </li>
                <li>
                  <span className="font-medium">Map Performance Breakdown</span>{" "}
                  - See how each team performs on different maps
                </li>
                <li>
                  <span className="font-medium">Team Lineups</span> - Preview
                  expected lineups and player statistics
                </li>
                <li>
                  <span className="font-medium">Combined Map Performance</span>{" "}
                  - Visual radar chart showing team strengths on each map
                </li>
                <li>
                  <span className="font-medium">Match Statistics</span> -
                  Detailed stats and predictions for upcoming matches
                </li>
                <li>
                  <span className="font-medium">FaceIT Links</span> - Direct
                  links to FaceIT matchrooms
                </li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Navigate to any upcoming
                match from the calendar or match listings. The detailed preview
                page provides comprehensive match analysis.
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Match Calendar 📆</h3>
              <p className="mb-2">
                We&apos;ve added a match calendar that displays all scheduled
                matches in an easy-to-browse calendar format.
              </p>

              <h4 className="font-bold text-lg mb-2">Key Features</h4>
              <ul className="list-disc pl-5 mb-3">
                <li>View all scheduled matches in a calendar view</li>
                <li>Filter matches by league, tier, and other criteria</li>
                <li>See match times, teams, and stream information</li>
                <li>Stream reservation system for casters and organizers</li>
                <li>Color-coded matches by tier and status</li>
              </ul>

              <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                <strong>Where to find it:</strong> Access the calendar from the
                season navigation menu. You can browse matches by date and
                filter by various criteria.
              </div>
            </div>
          </div>
        </section>

        {/* August 17, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">August 17, 2025</h2>
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:flex-1">
                <h3 className="text-xl font-bold mb-2">
                  📊 Historical Player Performance Analytics
                </h3>
                <p className="mb-2">
                  We&apos;ve added a new Historical Data tab to player profiles,
                  allowing you to track performance trends over time and compare
                  against league averages.
                </p>

                <h4 className="font-bold text-lg mb-2">Key Features</h4>
                <ul className="list-disc pl-5 mb-3">
                  <li>Visualize performance trends across multiple matches</li>
                  <li>
                    Compare your stats against Kanaliiga Average and FACEIT
                    level peers
                  </li>
                  <li>
                    Track improvements in KanaRating, K/D ratio, ADR and more
                  </li>
                  <li>
                    View advanced metrics like crosshair placement and
                    counter-strafing percentages
                  </li>
                </ul>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 rounded-md mt-4 mb-3">
                  <p className="font-bold">Note:</p>
                  <p>
                    The Historical Data tab has its own filtering system
                    separate from the general filters. Currently you can filter
                    by last 15/30 games or by FACEIT level, but not by map or
                    other criteria.
                  </p>
                </div>

                <div className="mt-3 p-2 bg-muted/50 rounded-md text-sm">
                  <strong>Where to find it:</strong> Go to any player&apos;s
                  profile page and click on the &quot;Historical Data&quot; tab.
                </div>
              </div>

              <div className="md:w-2/5">
                <Image
                  src={createNextUrl(
                    "/images/features/historical-data-preview.png"
                  )}
                  width={600}
                  height={350}
                  alt="Historical Data Preview"
                  className="rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* July 1, 2025 Features */}
        <section className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6 text-kanaliiga-orange border-b pb-2">
            <CalendarDays className="h-5 w-5" />
            <h2 className="text-xl font-bold">July 1, 2025</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-2">
                🎮 Kanahautomo: Find Your Gaming Squad
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
                  existing organizations or create new ones
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
                Perfect for organizations who want to organize their employees
                and help them find teammates for both casual and competitive
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
                📊 Player Skill Metrics Diagram
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
                🎮 Team Page Player Cards
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
                🏆 KanaRanks: Player Ranking System
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
            <li>Trade information from match</li>
            <li>Team management dashboard for captains</li>
            <li>Team calendar doodle for scheduling matches with opponents</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
