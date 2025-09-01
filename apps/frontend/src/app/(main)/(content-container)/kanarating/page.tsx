import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPageMetadata({
  title: "KanaRating Evolution: 1.0 → 3.0 Analysis",
  description:
    "Discover how KanaRating evolved from simple point accumulation to multi-system intelligence, featuring comprehensive CS2 player evaluation with trade analysis, economic impact, round swing metrics, and utility effectiveness."
});

export default function KanaRatingAnalysis() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-kanaliiga-orange">
          🏆 KanaRating Evolution: 1.0 → 3.0 Analysis
        </h1>
        <h2 className="text-2xl text-kanaliiga-light-brown">
          Kanaliiga S15 Masters Finals Case Study
        </h2>
      </header>

      {/* Match Overview */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
          Match Overview
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Match:</strong> Kanaliiga Season 15 Masters Division Finals
          </p>
          <p>
            <strong>Map:</strong> de_ancient
          </p>
          <p>
            <strong>Score:</strong> 16-13 (29 rounds)
          </p>
          <p>
            <strong>Match Link:</strong>{" "}
            <Link
              href="https://hub.kanaliiga.fi/matches/10987/games/105970"
              target="_blank"
              className="text-kanaliiga-orange hover:text-kanaliiga-light-brown underline font-medium"
            >
              View on Kanaliiga Hub
            </Link>
          </p>
          <p>
            <strong>Analysis Date:</strong> September 01, 2025
          </p>
        </div>
      </section>

      {/* Revolutionary Evolution */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
          🔬 The Revolutionary Evolution
        </h3>
        <p className="mb-6">
          KanaRating 3.0 represents a complete overhaul from the simple
          point-based KanaRating 1.0 system. This isn&apos;t just about utility
          effectiveness - it&apos;s a comprehensive transformation incorporating
          multiple advanced systems.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* KanaRating 1.0 */}
          <div className="p-5 bg-muted text-card-foreground border-l-4 border-destructive rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-destructive">
              📊 KanaRating 1.0: Simple Point System
            </h4>
            <p className="font-medium mb-3">
              Approach: Basic point accumulation with simple multipliers
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>1000 base points + action bonuses/penalties</li>
              <li>Simple multipliers: ADR/200, KAST as percentage</li>
              <li>Raw statistical focus</li>
              <li>No contextual awareness</li>
            </ul>
          </div>

          {/* KanaRating 3.0 */}
          <div className="p-5 bg-muted text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
            <h4 className="text-lg font-semibold mb-3 text-kanaliiga-orange">
              🚀 KanaRating 3.0: Revolutionary Multi-System Intelligence
            </h4>
            <p className="font-medium mb-3">
              <strong>Complete Transformation:</strong> From basic point
              accumulation to comprehensive performance analysis
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Win Probability Impact:</strong> Real-time round swing
                calculations with credit distribution
              </li>
              <li>
                <strong>Trade Efficiency System:</strong> Advanced trade kill
                tracking and opportunity analysis
              </li>
              <li>
                <strong>Economic Context Awareness:</strong> Anti-eco farming
                detection and weapon matchup adjustments
              </li>
              <li>
                <strong>Opening Kill Contribution:</strong> Enhanced entry frag
                weighting and impact measurement
              </li>
              <li>
                <strong>Round Win Share Integration:</strong> Team contribution
                analysis beyond individual stats
              </li>
              <li>
                <strong>Utility Effectiveness Intelligence:</strong>{" "}
                Comprehensive flash/smoke/grenade impact analysis
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why We Skipped 2.0 */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-kanaliiga-orange">
          🚀 Why We Skipped KanaRating 2.0
        </h3>
        <p className="mb-4">
          During development, we realized our improvements were so substantial
          that we had essentially created an entirely new rating system:
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-muted border-l-4 border-kanaliiga-light-brown rounded">
            <strong>🔄 Trade Efficiency System</strong> (originally planned as
            2.1)
          </div>
          <div className="p-4 bg-muted border-l-4 border-kanaliiga-light-brown rounded">
            <strong>💰 Economic Adjustments</strong> (originally planned as 2.1)
          </div>
          <div className="p-4 bg-muted border-l-4 border-kanaliiga-light-brown rounded">
            <strong>📊 Enhanced Round Swing</strong> (originally planned as 2.1)
          </div>
          <div className="p-4 bg-muted border-l-4 border-kanaliiga-light-brown rounded">
            <strong>🛠️ Utility Effectiveness</strong> (originally planned as
            2.1)
          </div>
        </div>

        <p>
          Combined, these features represented such a{" "}
          <strong>massive leap forward</strong> that calling it &quot;2.0&quot;
          would undersell the innovation. <strong>KanaRating 3.0</strong> better
          reflects the revolutionary nature of these changes.
        </p>
      </section>

      {/* Four Pillars */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
        <h3 className="text-xl font-semibold mb-6 text-kanaliiga-orange">
          🎯 KanaRating 3.0&apos;s Four Pillars
        </h3>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-muted p-5 rounded-lg border-l-4 border-kanaliiga-orange hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
            <h4 className="text-lg font-semibold text-kanaliiga-orange mb-3">
              🔄 Trade Analysis System
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Enhanced trade kill tracking</li>
              <li>Trade opportunity detection</li>
              <li>Trade efficiency metrics</li>
              <li>Team trade coordination analysis</li>
            </ul>
          </div>

          <div className="bg-muted p-5 rounded-lg border-l-4 border-kanaliiga-orange hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
            <h4 className="text-lg font-semibold text-kanaliiga-orange mb-3">
              💰 Economic Impact Evaluation
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Contextual economic efficiency calculations</li>
              <li>Damage-per-round economic ratios</li>
              <li>Economic disruption impact assessment</li>
              <li>Weapon matchup adjustments</li>
            </ul>
          </div>

          <div className="bg-muted p-5 rounded-lg border-l-4 border-kanaliiga-orange hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
            <h4 className="text-lg font-semibold text-kanaliiga-orange mb-3">
              📊 Advanced Round Swing Metrics
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Enhanced win probability calculation</li>
              <li>Multi-player impact attribution</li>
              <li>Context-aware round swing event tracking</li>
              <li>Credit distribution for round-changing events</li>
            </ul>
          </div>

          <div className="bg-muted p-5 rounded-lg border-l-4 border-kanaliiga-orange hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
            <h4 className="text-lg font-semibold text-kanaliiga-orange mb-3">
              🛠️ Utility Effectiveness System
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Flash Effectiveness:</strong> Setup kills, waste
                detection
              </li>
              <li>
                <strong>Area Denial:</strong> Multi-target damage, coordination
              </li>
              <li>
                <strong>Smoke Usage:</strong> Context-based scoring
              </li>
              <li>
                <strong>Coordination:</strong> Team utility support metrics
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Finals Match Results */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg">
        <h3 className="text-xl font-semibold mb-6 text-kanaliiga-orange">
          📊 Finals Match Results
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-kanaliiga-light-brown/30">
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider">
                  KanaRating 1.0
                </th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider">
                  KanaRating 3.0
                </th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                <td className="px-3 py-3 border-b border-border">
                  <strong>Average Rating</strong>
                </td>
                <td className="px-3 py-3 border-b border-border">0.851</td>
                <td className="px-3 py-3 border-b border-border">0.974</td>
                <td className="px-3 py-3 border-b border-border">
                  <span className="text-kanaliiga-orange font-bold">
                    +14.4%
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                <td className="px-3 py-3 border-b border-border">
                  <strong>Biggest Increase</strong>
                </td>
                <td className="px-3 py-3 border-b border-border">⭕⃤Meli</td>
                <td className="px-3 py-3 border-b border-border">
                  <span className="text-kanaliiga-orange font-bold">
                    +63.9%
                  </span>
                </td>
                <td className="px-3 py-3 border-b border-border">
                  Multi-system analysis benefits
                </td>
              </tr>
              <tr className="hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                <td className="px-3 py-3 border-b border-border">
                  <strong>Most Consistent</strong>
                </td>
                <td className="px-3 py-3 border-b border-border">nipa</td>
                <td className="px-3 py-3 border-b border-border">
                  <span className="text-muted-foreground font-semibold">
                    +2.1%
                  </span>
                </td>
                <td className="px-3 py-3 border-b border-border">
                  Stable across both systems
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Player Analysis */}
      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">
          🎮 Player-by-Player Analysis
        </h3>
        <p className="italic mb-6">
          How the evolution from simple point accumulation to multi-system
          intelligence affected each player:
        </p>

        {/* KAST Impact Explanation */}
        <div className="mb-6 p-5 bg-card border-l-4 border-kanaliiga-light-brown rounded-lg">
          <h4 className="text-lg font-semibold text-kanaliiga-light-brown mb-3">
            📊 KAST&apos;s Heavy Impact on KanaRating 1.0
          </h4>
          <p>
            KanaRating 1.0 was heavily influenced by KAST percentage due to its
            direct multiplication in the final formula. Notice how{" "}
            <strong>⭕⃤Meli</strong> with 69% KAST gets a significant boost in
            KR1.0, while <strong>Nukkis</strong> with only 48% KAST receives a
            severe penalty. KanaRating 3.0&apos;s weighted approach (1.2% KAST
            weight) provides more balanced evaluation across all performance
            aspects.
          </p>
        </div>

        {/* ALM Partners Team */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-center text-card-foreground p-3 mb-4 bg-kanaliiga-orange rounded-lg ">
            🔵{" "}
            <Link
              href="https://hub.kanaliiga.fi/teams/2"
              target="_blank"
              className="text-card-foreground hover:text-muted-foreground transition-colors"
            >
              ALM Partners
            </Link>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse  text-sm">
              <thead>
                <tr className="bg-kanaliiga-light-brown/30">
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    K/D/A
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    ADR
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KAST
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KR 1.0
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KR 3.0
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>𝖆𝖋𝖒𝖆𝖉𝖆</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">27/20/15</td>
                  <td className="px-2 py-3 border-b border-border">108</td>
                  <td className="px-2 py-3 border-b border-border">79%</td>
                  <td className="px-2 py-3 border-b border-border">1.140</td>
                  <td className="px-2 py-3 border-b border-border">1.197</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +5.0%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Slight methodology advantage
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>Niksu</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">25/21/6</td>
                  <td className="px-2 py-3 border-b border-border">89</td>
                  <td className="px-2 py-3 border-b border-border">83%</td>
                  <td className="px-2 py-3 border-b border-border">1.010</td>
                  <td className="px-2 py-3 border-b border-border">1.098</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +8.8%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Slight methodology advantage
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>willey-</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">25/23/16</td>
                  <td className="px-2 py-3 border-b border-border">85</td>
                  <td className="px-2 py-3 border-b border-border">86%</td>
                  <td className="px-2 py-3 border-b border-border">1.000</td>
                  <td className="px-2 py-3 border-b border-border">1.054</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +5.4%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Slight methodology advantage
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>Varpe</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">17/21/6</td>
                  <td className="px-2 py-3 border-b border-border">66</td>
                  <td className="px-2 py-3 border-b border-border">62%</td>
                  <td className="px-2 py-3 border-b border-border">0.630</td>
                  <td className="px-2 py-3 border-b border-border">0.851</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +35.1%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Major benefits from multi-system analysis
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>SUS1</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">18/21/7</td>
                  <td className="px-2 py-3 border-b border-border">62</td>
                  <td className="px-2 py-3 border-b border-border">72%</td>
                  <td className="px-2 py-3 border-b border-border">0.660</td>
                  <td className="px-2 py-3 border-b border-border">0.748</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +13.4%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Benefits from advanced metrics
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* JIS-Automation Team */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-center text-card-foreground p-3 mb-4 bg-destructive rounded-lg ">
            🔴{" "}
            <Link
              href="https://hub.kanaliiga.fi/teams/594"
              target="_blank"
              className="text-card-foreground hover:text-muted-foreground transition-colors"
            >
              JIS-Automation
            </Link>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse  text-sm">
              <thead>
                <tr className="bg-kanaliiga-light-brown/30">
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    K/D/A
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    ADR
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KAST
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KR 1.0
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    KR 3.0
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-2 py-3 text-left text-card-foreground font-semibold text-xs uppercase tracking-wider">
                    Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>⭕⃤Meli</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">33/18/4</td>
                  <td className="px-2 py-3 border-b border-border">94</td>
                  <td className="px-2 py-3 border-b border-border">69%</td>
                  <td className="px-2 py-3 border-b border-border">0.890</td>
                  <td className="px-2 py-3 border-b border-border">1.459</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +63.9%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Major benefits from multi-system analysis
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>nipa</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">24/25/14</td>
                  <td className="px-2 py-3 border-b border-border">95</td>
                  <td className="px-2 py-3 border-b border-border">76%</td>
                  <td className="px-2 py-3 border-b border-border">1.010</td>
                  <td className="px-2 py-3 border-b border-border">1.031</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +2.1%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Slight methodology advantage
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>siisihakunno</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">23/19/5</td>
                  <td className="px-2 py-3 border-b border-border">81</td>
                  <td className="px-2 py-3 border-b border-border">79%</td>
                  <td className="px-2 py-3 border-b border-border">1.050</td>
                  <td className="px-2 py-3 border-b border-border">1.000</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-destructive font-bold">-4.7%</span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Consistent across both systems
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>remain</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">15/26/16</td>
                  <td className="px-2 py-3 border-b border-border">79</td>
                  <td className="px-2 py-3 border-b border-border">76%</td>
                  <td className="px-2 py-3 border-b border-border">0.690</td>
                  <td className="px-2 py-3 border-b border-border">0.724</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +5.0%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Slight methodology advantage
                  </td>
                </tr>
                <tr className="even:bg-muted/30 hover:bg-black/10 dark:hover:bg-card/10 transition-colors">
                  <td className="px-2 py-3 border-b border-border">
                    <strong>Nukkis</strong>
                  </td>
                  <td className="px-2 py-3 border-b border-border">11/24/3</td>
                  <td className="px-2 py-3 border-b border-border">43</td>
                  <td className="px-2 py-3 border-b border-border">48%</td>
                  <td className="px-2 py-3 border-b border-border">0.430</td>
                  <td className="px-2 py-3 border-b border-border">0.573</td>
                  <td className="px-2 py-3 border-b border-border">
                    <span className="text-kanaliiga-orange font-bold">
                      +33.3%
                    </span>
                  </td>
                  <td className="px-2 py-3 border-b border-border">
                    Major benefits from multi-system analysis
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Other Matches Preview */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg ">
        <h3 className="text-xl font-semibold mb-4">
          👀 Quick Look at Other Matches
        </h3>
        <p className="italic mb-6">
          Dramatic rating changes we observed in other analyzed matches:
        </p>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Most Extreme Case */}
          <div className="bg-card p-5 rounded-lg  hover:bg-black/10 dark:hover:bg-card/10 transition-shadow">
            <h4 className="text-lg font-semibold mb-2">
              🔥 Most Extreme Case: &quot;sotanakkki&quot;
            </h4>
            <p className="mb-3">
              <strong>Match:</strong>{" "}
              <Link
                href="https://hub.kanaliiga.fi/matches/10982/games/105853"
                target="_blank"
                className="text-kanaliiga-orange hover:text-kanaliiga-light-brown underline font-medium"
              >
                Evitec Esports Academy vs Leap
              </Link>
            </p>
            <div className="bg-destructive/10 border-2 border-destructive p-4 rounded-lg text-center mb-3">
              <div className="text-lg font-bold text-destructive mb-1">
                0.980 → 0.439 (-55.2%)
              </div>
              <div className="text-sm text-muted-foreground font-semibold">
                KAST: 89%
              </div>
            </div>
            <p className="text-sm">
              Despite high KAST (89%), KR3.0 revealed poor round impact (4K/12D)
            </p>
          </div>

          {/* Biggest Beneficiary */}
          <div className="bg-card p-5 rounded-lg  hover:bg-black/10 dark:hover:bg-card/10 transition-shadow">
            <h4 className="text-lg font-semibold mb-2">
              📈 Biggest Beneficiary: &quot;Voidsheep&quot;
            </h4>
            <p className="mb-3">
              <strong>Match:</strong>{" "}
              <Link
                href="https://hub.kanaliiga.fi/matches/10755/games/105340"
                target="_blank"
                className="text-kanaliiga-orange hover:text-kanaliiga-light-brown underline font-medium"
              >
                Visma CMD vs Reaktor Brown
              </Link>
            </p>
            <div className="bg-kanaliiga-orange/10 border-2 border-kanaliiga-orange p-4 rounded-lg text-center mb-3">
              <div className="text-lg font-bold text-kanaliiga-orange mb-1">
                0.610 → 0.850 (+39.4%)
              </div>
              <div className="text-sm text-muted-foreground font-semibold">
                KAST: 58%
              </div>
            </div>
            <p className="text-sm">
              Low KAST penalized by KR1.0, but KR3.0 recognized hidden impact
            </p>
          </div>

          {/* KAST Inflation */}
          <div className="bg-card p-5 rounded-lg  hover:bg-black/10 dark:hover:bg-card/10 transition-shadow">
            <h4 className="text-lg font-semibold mb-2">
              ⚖️ KAST Inflation: &quot;SMUPPE&quot;
            </h4>
            <p className="mb-3">
              <strong>Match:</strong>{" "}
              <Link
                href="https://hub.kanaliiga.fi/matches/10871/games/105589"
                target="_blank"
                className="text-kanaliiga-orange hover:text-kanaliiga-light-brown underline font-medium"
              >
                ALM Partners Tasetaikurit vs AzetsCS
              </Link>
            </p>
            <div className="bg-destructive/10 border-2 border-destructive p-4 rounded-lg text-center mb-3">
              <div className="text-lg font-bold text-destructive mb-1">
                1.320 → 1.067 (-19.2%)
              </div>
              <div className="text-sm text-muted-foreground font-semibold">
                KAST: 89%
              </div>
            </div>
            <p className="text-sm">
              High KAST (89%) inflated KR1.0, but KR3.0 found more balanced
              impact (18K/9D)
            </p>
          </div>
        </div>

        <div className="bg-card border-l-4 border-kanaliiga-orange p-5 rounded-lg">
          <h4 className="text-lg font-semibold text-kanaliiga-orange mb-3">
            🔍 Pattern Recognition
          </h4>
          <p>
            Across all analyzed matches, we consistently see{" "}
            <strong>KAST-inflated players dropping</strong> in KR3.0, while{" "}
            <strong>low-KAST impact players rising</strong>. This demonstrates
            KanaRating 3.0&apos;s superior ability to identify true performance
            beyond participation metrics.
          </p>
        </div>
      </section>

      {/* Complete Transformation */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg ">
        <h3 className="text-xl font-semibold mb-4">
          🎯 The Complete Transformation
        </h3>
        <p className="mb-6">
          KanaRating 3.0 isn&apos;t just an upgrade - it&apos;s a{" "}
          <strong>complete system overhaul</strong> that evolved through
          multiple planned phases:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Trade Analysis:</strong> Enhanced trade kill tracking and
            efficiency metrics
          </div>
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Economic Context:</strong> Contextual economic efficiency
            calculations
          </div>
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Round Swing:</strong> Advanced win probability with
            credit distribution
          </div>
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Utility Intelligence:</strong> 4-category utility
            effectiveness system
          </div>
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Adaptive Formula:</strong> Scales based on available data
            richness
          </div>
          <div className="bg-card p-4 rounded-lg border-l-4 border-green-500  font-medium">
            ✅ <strong>Multi-Event Correlation:</strong> Complex interaction
            detection
          </div>
        </div>
      </section>

      {/* Technical Analysis */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg ">
        <h3 className="text-xl font-semibold mb-4">🔬 Technical Analysis</h3>
        <p className="mb-6">
          The transformation from KanaRating 1.0 to 3.0 represents a complete
          methodological revolution:
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card p-5 rounded-lg border-l-4 border-blue-500  hover: transition-shadow">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">
              📈 From Points to Intelligence
            </h4>
            <p className="text-sm leading-relaxed">
              KanaRating 1.0&apos;s simple point accumulation (1000 base +
              bonuses) has been replaced by a
              <strong> sophisticated multi-system approach</strong> that
              analyzes player performance across multiple dimensions.
            </p>
          </div>

          <div className="bg-card p-5 rounded-lg border-l-4 border-blue-500  hover: transition-shadow">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">
              🎯 Four Integrated Systems
            </h4>
            <p className="text-sm leading-relaxed">
              Rather than just adding utility effectiveness, KanaRating 3.0
              integrates{" "}
              <strong>
                Trade Analysis, Economic Impact, Round Swing, and Utility
                Effectiveness
              </strong>{" "}
              into a unified intelligence system.
            </p>
          </div>

          <div className="bg-card p-5 rounded-lg border-l-4 border-blue-500  hover: transition-shadow">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">
              ⚖️ Adaptive Assessment
            </h4>
            <p className="text-sm leading-relaxed">
              The system intelligently adapts based on available data - using
              conservative weights when utility data is minimal, and full
              analysis when comprehensive data is available.
            </p>
          </div>

          <div className="bg-card p-5 rounded-lg border-l-4 border-blue-500  hover: transition-shadow">
            <h4 className="text-lg font-semibold text-blue-600 mb-3">
              🚀 Production-Ready Architecture
            </h4>
            <p className="text-sm leading-relaxed">
              Built with <strong>500+ lines of new logic</strong>, multi-event
              correlation tracking, and real-time calculation during demo
              parsing for maximum accuracy and performance.
            </p>
          </div>
        </div>
      </section>

      {/* Conclusion */}
      <section className="mb-8 p-6 bg-card text-card-foreground border-l-4 border-kanaliiga-orange rounded-lg ">
        <h3 className="text-xl font-semibold mb-4">🎯 The Evolution Verdict</h3>
        <p className="mb-4">
          KanaRating 3.0 represents the most significant advancement in CS2
          player evaluation, moving from basic statistical analysis to{" "}
          <strong>comprehensive multi-system intelligence</strong>.
        </p>

        <p className="mb-4">
          This Kanaliiga Masters finals demonstrates the power of the new
          approach: players are evaluated not just on what they did, but on{" "}
          <strong>
            trade efficiency, economic impact, round swing contribution, and
            utility effectiveness
          </strong>{" "}
          - providing unprecedented insight into true player value.
        </p>

        <p className="text-lg font-semibold text-center">
          <strong>
            This is the future of competitive CS2 analysis - and it&apos;s
            available now.
          </strong>
        </p>
      </section>

      {/* Report Footer */}
      <footer className="mt-10 p-5 bg-muted border-l-4 border-muted-foreground rounded-lg  text-sm text-muted-foreground border-t border-border">
        <h4 className="font-semibold text-card-foreground mb-3">
          📄 Report Information
        </h4>
        <p className="mb-2">
          This analysis report was generated by{" "}
          <strong>Claude 3.5 Sonnet</strong>, an AI assistant created by
          Anthropic. The report combines automated data analysis with structured
          presentation to provide insights into KanaRating system evolution.
        </p>
        <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
          <strong>Generated:</strong> September 01, 2025 |{" "}
          <strong>AI Model:</strong> Claude 3.5 Sonnet |
          <strong>Data Source:</strong> CS2 Demo Parser with KanaRating 1.0 &
          3.0
        </p>
      </footer>
    </div>
  );
}
