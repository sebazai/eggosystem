import { useHostTheme } from "cursor/canvas";

/* ─── palette ─────────────────────────────── */
const T_COLOR = "#fcd34d";
const CT_COLOR = "#7dd3fc";
const WIN = "#86efac";
const WARN = "#fde68a";
const LOSE = "#fca5a5";

/* ─── mock data ──────────────────────────── */
const TEAM_A = "7dos";
const TEAM_B = "Elisa SOCKS5";

type Player = {
  name: string;
  team: "T" | "CT";
  trade_opportunities: number;
  trade_attempts: number;
  trades: number;
  traded: number;
  deaths: number;
  first_death_traded: number;
  first_deaths_tradeable: number;
  first_deaths: number;
};

const PLAYERS: Player[] = [
  {
    name: "Lehtu",
    team: "T",
    trade_opportunities: 6,
    trade_attempts: 5,
    trades: 3,
    traded: 2,
    deaths: 14,
    first_death_traded: 1,
    first_deaths_tradeable: 2,
    first_deaths: 3
  },
  {
    name: "enzoj",
    team: "T",
    trade_opportunities: 4,
    trade_attempts: 2,
    trades: 1,
    traded: 3,
    deaths: 16,
    first_death_traded: 2,
    first_deaths_tradeable: 3,
    first_deaths: 4
  },
  {
    name: "defektro",
    team: "T",
    trade_opportunities: 5,
    trade_attempts: 4,
    trades: 2,
    traded: 1,
    deaths: 13,
    first_death_traded: 0,
    first_deaths_tradeable: 1,
    first_deaths: 2
  },
  {
    name: "van9",
    team: "T",
    trade_opportunities: 3,
    trade_attempts: 1,
    trades: 0,
    traded: 2,
    deaths: 15,
    first_death_traded: 1,
    first_deaths_tradeable: 2,
    first_deaths: 3
  },
  {
    name: "meppi",
    team: "T",
    trade_opportunities: 3,
    trade_attempts: 2,
    trades: 1,
    traded: 1,
    deaths: 12,
    first_death_traded: 0,
    first_deaths_tradeable: 1,
    first_deaths: 2
  },
  {
    name: "monke",
    team: "CT",
    trade_opportunities: 7,
    trade_attempts: 6,
    trades: 4,
    traded: 2,
    deaths: 10,
    first_death_traded: 1,
    first_deaths_tradeable: 2,
    first_deaths: 3
  },
  {
    name: "Silmämies",
    team: "CT",
    trade_opportunities: 5,
    trade_attempts: 3,
    trades: 2,
    traded: 1,
    deaths: 11,
    first_death_traded: 0,
    first_deaths_tradeable: 1,
    first_deaths: 2
  },
  {
    name: "HuuruC",
    team: "CT",
    trade_opportunities: 4,
    trade_attempts: 2,
    trades: 1,
    traded: 2,
    deaths: 13,
    first_death_traded: 1,
    first_deaths_tradeable: 2,
    first_deaths: 3
  },
  {
    name: "Ram",
    team: "CT",
    trade_opportunities: 6,
    trade_attempts: 5,
    trades: 3,
    traded: 1,
    deaths: 9,
    first_death_traded: 0,
    first_deaths_tradeable: 1,
    first_deaths: 2
  },
  {
    name: "Armaio",
    team: "CT",
    trade_opportunities: 3,
    trade_attempts: 1,
    trades: 0,
    traded: 3,
    deaths: 14,
    first_death_traded: 2,
    first_deaths_tradeable: 2,
    first_deaths: 3
  }
];

// Who traded whom: MATRIX[trader][killerTheyPunished] = count
const MATRIX: Record<string, Record<string, number>> = {
  Lehtu: { monke: 1, Ram: 1 },
  enzoj: { Ram: 1 },
  defektro: { monke: 1 },
  meppi: { Silmämies: 1, monke: 1 },
  van9: {},
  monke: { enzoj: 1, meppi: 1, defektro: 1 },
  Silmämies: { van9: 1 },
  HuuruC: {},
  Ram: { Lehtu: 1, meppi: 1 },
  Armaio: {}
};

const T_PLAYERS = PLAYERS.filter((p) => p.team === "T");
const CT_PLAYERS = PLAYERS.filter((p) => p.team === "CT");

/* ─── utilities ──────────────────────────── */
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const effColor = (v: number, lo = 35, hi = 60) =>
  v >= hi ? WIN : v >= lo ? WARN : LOSE;

function SectionDivider({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        margin: "32px 0 24px"
      }}
    >
      <div
        style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }}
      />
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          padding: "4px 14px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99
        }}
      >
        {title}
      </div>
      <div
        style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }}
      />
    </div>
  );
}

/* ─── stacked bar: success / failed / ignored ─ */
function FunnelBar({
  opp,
  att,
  conv,
  height = 6
}: {
  opp: number;
  att: number;
  conv: number;
  height?: number;
}) {
  const failed = att - conv;
  const ignored = opp - att;
  return (
    <div
      style={{
        height,
        borderRadius: 99,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        display: "flex"
      }}
    >
      {conv > 0 && <div style={{ flex: conv, background: `${WIN}80` }} />}
      {failed > 0 && <div style={{ flex: failed, background: `${WARN}60` }} />}
      {ignored > 0 && (
        <div style={{ flex: ignored, background: `${LOSE}40` }} />
      )}
    </div>
  );
}

/* ─── mini rate bar ─────────────────────── */
function RateBar({
  value,
  label,
  sub
}: {
  value: number;
  label: string;
  sub?: string;
}) {
  const c = effColor(value);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          marginBottom: 3
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
        <span style={{ fontWeight: 700, color: c }}>{value}%</span>
      </div>
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden"
        }}
      >
        <div style={{ height: "100%", width: `${value}%`, background: c }} />
      </div>
      {sub && (
        <div
          style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", marginTop: 2 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 1 — Team Trade Discipline
   ══════════════════════════════════════════ */

function PlayerRankRow({
  p,
  tc,
  rankBy
}: {
  p: Player;
  tc: string;
  rankBy: "trade" | "death";
}) {
  const value =
    rankBy === "trade"
      ? pct(p.trades, p.trade_opportunities)
      : pct(p.traded, p.deaths);
  const detail =
    rankBy === "trade"
      ? `${p.trades}/${p.trade_opportunities} opp`
      : `${p.traded}/${p.deaths} deaths`;
  const c = effColor(value);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)"
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: tc, flex: 1 }}>
        {p.name}
      </span>
      <span
        style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", width: 52 }}
      >
        {detail}
      </span>
      <div
        style={{
          width: 72,
          height: 4,
          borderRadius: 99,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden"
        }}
      >
        <div style={{ height: "100%", width: `${value}%`, background: c }} />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          width: 34,
          textAlign: "right",
          color: c
        }}
      >
        {value}%
      </span>
    </div>
  );
}

function TeamDisciplineCard({
  players,
  teamName,
  tc
}: {
  players: Player[];
  teamName: string;
  tc: string;
}) {
  const opp = players.reduce((s, p) => s + p.trade_opportunities, 0);
  const att = players.reduce((s, p) => s + p.trade_attempts, 0);
  const conv = players.reduce((s, p) => s + p.trades, 0);
  const died = players.reduce((s, p) => s + p.deaths, 0);
  const trad = players.reduce((s, p) => s + p.traded, 0);

  const attRate = pct(att, opp);
  const convRate = pct(conv, att);
  const tradedPct = pct(trad, died);

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        border: `1px solid rgba(255,255,255,0.08)`,
        background: "rgba(255,255,255,0.02)"
      }}
    >
      {/* team name + headline numbers */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, color: tc }}>
          {teamName}
        </div>
        <div style={{ display: "flex", gap: 18, textAlign: "right" }}>
          {[
            { v: opp, l: "opportunities" },
            { v: `${attRate}%`, l: "attempt rate", c: effColor(attRate) },
            { v: `${convRate}%`, l: "conversion", c: effColor(convRate) },
            {
              v: `${tradedPct}%`,
              l: "deaths traded",
              c: effColor(tradedPct, 25, 45)
            }
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: (s as any).c ?? "rgba(255,255,255,0.85)"
                }}
              >
                {s.v}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.28)",
                  marginTop: 1,
                  whiteSpace: "nowrap"
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* team funnel bar */}
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            marginBottom: 4
          }}
        >
          <span style={{ color: WIN }}>Success ({conv})</span>
          <span style={{ color: WARN }}>Failed ({att - conv})</span>
          <span style={{ color: LOSE }}>Ignored ({opp - att})</span>
        </div>
        <FunnelBar opp={opp} att={att} conv={conv} height={8} />
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          margin: "14px 0"
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Best traders */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              marginBottom: 8
            }}
          >
            Trade efficiency ↓
          </div>
          {[...players]
            .sort(
              (a, b) =>
                pct(b.trades, b.trade_opportunities) -
                pct(a.trades, a.trade_opportunities)
            )
            .map((p) => (
              <PlayerRankRow key={p.name} p={p} tc={tc} rankBy="trade" />
            ))}
        </div>
        {/* Death quality */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.22)",
              marginBottom: 8
            }}
          >
            Deaths traded ↓
          </div>
          {[...players]
            .sort((a, b) => pct(b.traded, b.deaths) - pct(a.traded, a.deaths))
            .map((p) => (
              <PlayerRankRow key={p.name} p={p} tc={tc} rankBy="death" />
            ))}
        </div>
      </div>
    </div>
  );
}

function Section1() {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 16,
          lineHeight: 1.6
        }}
      >
        Team-level trade funnel — how often each team takes trade opportunities,
        attempts them, and converts. Right side shows how well-positioned
        players are when they die (did a teammate avenge them?).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <TeamDisciplineCard
          players={T_PLAYERS}
          teamName={TEAM_A}
          tc={T_COLOR}
        />
        <TeamDisciplineCard
          players={CT_PLAYERS}
          teamName={TEAM_B}
          tc={CT_COLOR}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 2 — Full Per-Player Trade Profile
   ══════════════════════════════════════════ */

function DeathBar({ p }: { p: Player }) {
  const traded = p.traded;
  const inRange = Math.max(0, Math.floor(p.deaths * 0.2));
  const isolated = Math.max(0, p.deaths - traded - inRange);
  const total = p.deaths;
  return (
    <div
      style={{
        height: 6,
        borderRadius: 99,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
        display: "flex"
      }}
    >
      {traded > 0 && <div style={{ flex: traded, background: `${WIN}80` }} />}
      {inRange > 0 && (
        <div style={{ flex: inRange, background: `${WARN}55` }} />
      )}
      {isolated > 0 && (
        <div style={{ flex: isolated, background: `${LOSE}40` }} />
      )}
    </div>
  );
}

function FullPlayerCard({ p, tc }: { p: Player; tc: string }) {
  const attRate = pct(p.trade_attempts, p.trade_opportunities);
  const convRate = pct(p.trades, p.trade_attempts);
  const tradedPct = pct(p.traded, p.deaths);
  const fdPct = pct(p.first_death_traded, p.first_deaths_tradeable || 1);

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: tc }}>
          {p.name}
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { v: p.trade_opportunities, l: "opp" },
            { v: p.trade_attempts, l: "tried" },
            { v: p.trades, l: "success", c: WIN }
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: (s as any).c ?? "rgba(255,255,255,0.8)"
                }}
              >
                {s.v}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── when killing: opportunity funnel ── */}
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          marginBottom: 5
        }}
      >
        When a teammate is killed nearby →
      </div>
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            marginBottom: 3
          }}
        >
          <span style={{ color: WIN }}>Success ({p.trades})</span>
          <span style={{ color: WARN }}>
            Failed ({p.trade_attempts - p.trades})
          </span>
          <span style={{ color: LOSE }}>
            Ignored ({p.trade_opportunities - p.trade_attempts})
          </span>
        </div>
        <FunnelBar
          opp={p.trade_opportunities}
          att={p.trade_attempts}
          conv={p.trades}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 8,
          marginBottom: 12
        }}
      >
        <RateBar
          value={attRate}
          label="Attempt rate"
          sub={`Tried ${p.trade_attempts}/${p.trade_opportunities} opportunities`}
        />
        <RateBar
          value={convRate}
          label="Conversion rate"
          sub={`Got ${p.trades}/${p.trade_attempts} attempts`}
        />
      </div>

      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.05)",
          marginBottom: 10
        }}
      />

      {/* ── when dying ── */}
      <div
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          marginBottom: 5
        }}
      >
        When you die →
      </div>
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            marginBottom: 3
          }}
        >
          <span style={{ color: WIN }}>Traded ({p.traded})</span>
          <span style={{ color: WARN }}>In range</span>
          <span style={{ color: LOSE }}>Isolated</span>
        </div>
        <DeathBar p={p} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 8
        }}
      >
        <RateBar
          value={tradedPct}
          label="Death traded rate"
          sub={`${p.traded}/${p.deaths} deaths avenged`}
        />
        <RateBar
          value={fdPct}
          label="FK death traded"
          sub={`${p.first_death_traded}/${p.first_deaths_tradeable} tradeable FK deaths`}
        />
      </div>
    </div>
  );
}

function Section2() {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 16,
          lineHeight: 1.6
        }}
      >
        Full trade profile per player: the opportunity funnel when killing (did
        you try? did you succeed?), and how well-positioned your deaths were
        (were you traded?).
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T_COLOR,
              marginBottom: 10
            }}
          >
            {TEAM_A}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {T_PLAYERS.map((p) => (
              <FullPlayerCard key={p.name} p={p} tc={T_COLOR} />
            ))}
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: CT_COLOR,
              marginBottom: 10
            }}
          >
            {TEAM_B}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CT_PLAYERS.map((p) => (
              <FullPlayerCard key={p.name} p={p} tc={CT_COLOR} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 3 — Trade relationship map
   Intuitive: show both directions in one grid.
   Rows = trader, columns = "who they punished".
   Colour-coded headers by team.
   ══════════════════════════════════════════ */

function MatrixCell({ v, isEnemy }: { v: number; isEnemy: boolean }) {
  const base = isEnemy ? "rgba(134,239,172," : "rgba(252,165,165,";
  const alpha = v === 0 ? 0 : Math.min(0.85, 0.18 + v * 0.3);
  const color = isEnemy ? WIN : LOSE;
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 5,
        background: v > 0 ? `${base}${alpha})` : "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: v > 0 ? color : "rgba(255,255,255,0.15)"
      }}
    >
      {v > 0 ? v : "·"}
    </div>
  );
}

function Section3() {
  const allNames = [
    ...T_PLAYERS.map((p) => p.name),
    ...CT_PLAYERS.map((p) => p.name)
  ];
  const tNames = T_PLAYERS.map((p) => p.name);
  const ctNames = CT_PLAYERS.map((p) => p.name);

  // Total trades made per player (row sum)
  const rowTotal = (trader: string) =>
    Object.values(MATRIX[trader] ?? {}).reduce((s, v) => s + v, 0);
  // Total times a player was traded against (col sum)
  const colTotal = (target: string) =>
    allNames.reduce((s, trader) => s + (MATRIX[trader]?.[target] ?? 0), 0);

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          marginBottom: 16,
          lineHeight: 1.6
        }}
      >
        Who avenged whom. Each row is a <em>trader</em>; each column is the
        enemy killer they punished.
        <span style={{ color: `${WIN}cc` }}> Green</span> = trading an enemy
        kill (good). Column totals show which enemy players get traded most —
        meaning they often kill in dangerous spots.
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: 4,
            minWidth: 600
          }}
        >
          <thead>
            <tr>
              {/* corner */}
              <th colSpan={2} style={{ paddingBottom: 6, textAlign: "left" }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)"
                  }}
                >
                  TRADER ↓ · punished →
                </div>
              </th>
              {/* enemy column headers, split by team */}
              {tNames.map((n) => (
                <th
                  key={n}
                  style={{ padding: "0 0 6px", verticalAlign: "bottom" }}
                >
                  <div
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: T_COLOR,
                      whiteSpace: "nowrap",
                      paddingBottom: 4,
                      maxHeight: 70,
                      overflow: "hidden"
                    }}
                  >
                    {n}
                  </div>
                </th>
              ))}
              {/* separator */}
              <th style={{ width: 8 }} />
              {ctNames.map((n) => (
                <th
                  key={n}
                  style={{ padding: "0 0 6px", verticalAlign: "bottom" }}
                >
                  <div
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      fontSize: 10,
                      fontWeight: 700,
                      color: CT_COLOR,
                      whiteSpace: "nowrap",
                      paddingBottom: 4,
                      maxHeight: 70,
                      overflow: "hidden"
                    }}
                  >
                    {n}
                  </div>
                </th>
              ))}
              <th style={{ width: 8 }} />
              <th
                style={{
                  padding: "0 0 6px 8px",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  verticalAlign: "bottom"
                }}
              >
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {/* T traders */}
            {T_PLAYERS.map((p, ri) => {
              const row = MATRIX[p.name] ?? {};
              const total = rowTotal(p.name);
              return (
                <tr key={p.name}>
                  {ri === 0 && (
                    <td
                      rowSpan={T_PLAYERS.length}
                      style={{ paddingRight: 6, verticalAlign: "middle" }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: T_COLOR + "88",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {TEAM_A}
                      </div>
                    </td>
                  )}
                  <td style={{ paddingRight: 8, whiteSpace: "nowrap" }}>
                    <span
                      style={{ fontSize: 12, fontWeight: 600, color: T_COLOR }}
                    >
                      {p.name}
                    </span>
                  </td>
                  {/* own team cells — can't trade own team, show as dim */}
                  {tNames.map((opp) => (
                    <td key={opp} style={{ padding: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 5,
                          background: "rgba(255,255,255,0.015)",
                          border: "1px solid rgba(255,255,255,0.04)"
                        }}
                      />
                    </td>
                  ))}
                  <td />
                  {/* enemy cells */}
                  {ctNames.map((opp) => (
                    <td key={opp} style={{ padding: 0 }}>
                      <MatrixCell v={row[opp] ?? 0} isEnemy={true} />
                    </td>
                  ))}
                  <td />
                  <td
                    style={{
                      paddingLeft: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: total > 0 ? WIN : "rgba(255,255,255,0.2)",
                      verticalAlign: "middle"
                    }}
                  >
                    {total || "—"}
                  </td>
                </tr>
              );
            })}

            {/* gap row */}
            <tr>
              <td colSpan={99} style={{ height: 6 }} />
            </tr>

            {/* CT traders */}
            {CT_PLAYERS.map((p, ri) => {
              const row = MATRIX[p.name] ?? {};
              const total = rowTotal(p.name);
              return (
                <tr key={p.name}>
                  {ri === 0 && (
                    <td
                      rowSpan={CT_PLAYERS.length}
                      style={{ paddingRight: 6, verticalAlign: "middle" }}
                    >
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: CT_COLOR + "88",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {TEAM_B}
                      </div>
                    </td>
                  )}
                  <td style={{ paddingRight: 8, whiteSpace: "nowrap" }}>
                    <span
                      style={{ fontSize: 12, fontWeight: 600, color: CT_COLOR }}
                    >
                      {p.name}
                    </span>
                  </td>
                  {/* enemy cells (T team) */}
                  {tNames.map((opp) => (
                    <td key={opp} style={{ padding: 0 }}>
                      <MatrixCell v={row[opp] ?? 0} isEnemy={true} />
                    </td>
                  ))}
                  <td />
                  {/* own team — blank */}
                  {ctNames.map((opp) => (
                    <td key={opp} style={{ padding: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 5,
                          background: "rgba(255,255,255,0.015)",
                          border: "1px solid rgba(255,255,255,0.04)"
                        }}
                      />
                    </td>
                  ))}
                  <td />
                  <td
                    style={{
                      paddingLeft: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: total > 0 ? WIN : "rgba(255,255,255,0.2)",
                      verticalAlign: "middle"
                    }}
                  >
                    {total || "—"}
                  </td>
                </tr>
              );
            })}

            {/* column totals */}
            <tr>
              <td colSpan={99} style={{ height: 4 }} />
            </tr>
            <tr>
              <td
                colSpan={2}
                style={{
                  paddingRight: 8,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  textAlign: "right",
                  verticalAlign: "middle"
                }}
              >
                Times traded ↓
              </td>
              {tNames.map((n) => {
                const t = colTotal(n);
                return (
                  <td
                    key={n}
                    style={{ textAlign: "center", verticalAlign: "middle" }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t > 0 ? LOSE : "rgba(255,255,255,0.2)"
                      }}
                    >
                      {t || "·"}
                    </span>
                  </td>
                );
              })}
              <td />
              {ctNames.map((n) => {
                const t = colTotal(n);
                return (
                  <td
                    key={n}
                    style={{ textAlign: "center", verticalAlign: "middle" }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t > 0 ? LOSE : "rgba(255,255,255,0.2)"
                      }}
                    >
                      {t || "·"}
                    </span>
                  </td>
                );
              })}
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* legend */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 20,
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          flexWrap: "wrap"
        }}
      >
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 2,
              background: `rgba(134,239,172,0.5)`,
              marginRight: 4,
              verticalAlign: "middle"
            }}
          />
          Green cell = trade made (row player avenged teammate against column
          enemy)
        </span>
        <span>
          <span style={{ fontWeight: 700, color: LOSE }}>Red number</span> in
          bottom row = times that player was traded out (they killed in a
          dangerous spot)
        </span>
        <span>
          <span style={{ fontWeight: 700, color: WIN }}>Σ</span> = total trades
          made by that player this game
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT — single scrollable page
   ══════════════════════════════════════════ */
export default function TradeAnalysisFinal() {
  const t = useHostTheme();
  const bg = t?.background?.primary ?? "#0d1117";
  const border = t?.stroke?.secondary ?? "rgba(255,255,255,0.08)";

  return (
    <div
      style={{
        background: bg,
        minHeight: "100vh",
        padding: "28px 28px 60px",
        fontFamily: "sans-serif",
        color: "#e2e8f0"
      }}
    >
      {/* page header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: 6
          }}
        >
          Detailed Analysis · Trade Tab
        </div>
        <div
          style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}
        >
          Trades &amp; Trade Efficiency
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.32)",
            marginTop: 4
          }}
        >
          7dos · Elisa SOCKS5 · Anubis — 17 rounds · Mock data
        </div>
      </div>

      {/* legend strip */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 28,
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          flexWrap: "wrap"
        }}
      >
        {[
          { color: WIN, label: "Success / traded" },
          { color: WARN, label: "Failed / in range" },
          { color: LOSE, label: "Ignored / isolated" }
        ].map((l) => (
          <span
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 2,
                background: l.color + "66"
              }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Section 1 ── */}
      <SectionDivider title="Team Trade Discipline" />
      <Section1 />

      {/* ── Section 2 ── */}
      <SectionDivider title="Player Trade Profile" />
      <Section2 />

      {/* ── Section 3 ── */}
      <SectionDivider title="Trade Relationship Matrix" />
      <Section3 />
    </div>
  );
}
