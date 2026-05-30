import {
  BarChart,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme
} from "cursor/canvas";

/* ─── data ──────────────────────────────────────────── */
const TEAM_A = "7dos";
const TEAM_B = "Elisa SOCKS5";

type P = {
  name: string;
  team: "T" | "CT";
  opp: number;
  att: number;
  conv: number;
  traded: number;
  deaths: number;
  fdTraded: number;
  fdTradeable: number;
  fdDeaths: number;
};

const PLAYERS: P[] = [
  {
    name: "Lehtu",
    team: "T",
    opp: 6,
    att: 5,
    conv: 3,
    traded: 2,
    deaths: 14,
    fdTraded: 1,
    fdTradeable: 2,
    fdDeaths: 3
  },
  {
    name: "enzoj",
    team: "T",
    opp: 4,
    att: 2,
    conv: 1,
    traded: 3,
    deaths: 16,
    fdTraded: 2,
    fdTradeable: 3,
    fdDeaths: 4
  },
  {
    name: "defektro",
    team: "T",
    opp: 5,
    att: 4,
    conv: 2,
    traded: 1,
    deaths: 13,
    fdTraded: 0,
    fdTradeable: 1,
    fdDeaths: 2
  },
  {
    name: "van9",
    team: "T",
    opp: 3,
    att: 1,
    conv: 0,
    traded: 2,
    deaths: 15,
    fdTraded: 1,
    fdTradeable: 2,
    fdDeaths: 3
  },
  {
    name: "meppi",
    team: "T",
    opp: 3,
    att: 2,
    conv: 1,
    traded: 1,
    deaths: 12,
    fdTraded: 0,
    fdTradeable: 1,
    fdDeaths: 2
  },
  {
    name: "monke",
    team: "CT",
    opp: 7,
    att: 6,
    conv: 4,
    traded: 2,
    deaths: 10,
    fdTraded: 1,
    fdTradeable: 2,
    fdDeaths: 3
  },
  {
    name: "Silmämies",
    team: "CT",
    opp: 5,
    att: 3,
    conv: 2,
    traded: 1,
    deaths: 11,
    fdTraded: 0,
    fdTradeable: 1,
    fdDeaths: 2
  },
  {
    name: "HuuruC",
    team: "CT",
    opp: 4,
    att: 2,
    conv: 1,
    traded: 2,
    deaths: 13,
    fdTraded: 1,
    fdTradeable: 2,
    fdDeaths: 3
  },
  {
    name: "Ram",
    team: "CT",
    opp: 6,
    att: 5,
    conv: 3,
    traded: 1,
    deaths: 9,
    fdTraded: 0,
    fdTradeable: 1,
    fdDeaths: 2
  },
  {
    name: "Armaio",
    team: "CT",
    opp: 3,
    att: 1,
    conv: 0,
    traded: 3,
    deaths: 14,
    fdTraded: 2,
    fdTradeable: 2,
    fdDeaths: 3
  }
];

const T = PLAYERS.filter((p) => p.team === "T");
const CT = PLAYERS.filter((p) => p.team === "CT");

// Who traded whom — trader → { opponent killer: count }
const TRADES: Record<string, Record<string, number>> = {
  Lehtu: { monke: 2, Ram: 1 },
  enzoj: { Ram: 1 },
  defektro: { monke: 1 },
  meppi: { Silmämies: 1, monke: 1 },
  van9: {},
  monke: { enzoj: 1, meppi: 1, defektro: 1 },
  Silmämies: { van9: 1, Lehtu: 1 },
  HuuruC: { enzoj: 1 },
  Ram: { Lehtu: 1, meppi: 1 },
  Armaio: {}
};

/* ─── helpers ────────────────────────────────────────── */
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
const rateTone = (v: number, hi = 60, lo = 35) =>
  v >= hi ? "success" : v >= lo ? "warning" : "danger";

function teamSum(players: P[]) {
  return players.reduce(
    (s, p) => ({
      opp: s.opp + p.opp,
      att: s.att + p.att,
      conv: s.conv + p.conv,
      traded: s.traded + p.traded,
      deaths: s.deaths + p.deaths
    }),
    { opp: 0, att: 0, conv: 0, traded: 0, deaths: 0 }
  );
}

/* ══════════════════════════════════════════════════════
   SECTION 1 — Team Trade Discipline
   ══════════════════════════════════════════════════════ */

function TeamDisciplineCard({ players, name }: { players: P[]; name: string }) {
  const s = teamSum(players);
  const attRate = pct(s.att, s.opp);
  const convRate = pct(s.conv, s.att);
  const tradedRate = pct(s.traded, s.deaths);

  const byEff = [...players].sort(
    (a, b) => pct(b.conv, b.opp) - pct(a.conv, a.opp)
  );

  return (
    <Card>
      <CardHeader>{name}</CardHeader>
      <CardBody>
        <Stack gap={16}>
          {/* Key numbers */}
          <Grid columns={3} gap={8}>
            <Stat value={s.opp} label="Opportunities" />
            <Stat
              value={`${attRate}%`}
              label="Attempt rate"
              tone={rateTone(attRate) as any}
            />
            <Stat
              value={`${convRate}%`}
              label="Conversion"
              tone={rateTone(convRate) as any}
            />
          </Grid>

          {/* Funnel chart — normalized stacked: converted / failed / ignored */}
          <BarChart
            categories={players.map((p) => p.name)}
            series={[
              {
                name: "Converted",
                data: players.map((p) => p.conv),
                tone: "success"
              },
              {
                name: "Failed",
                data: players.map((p) => p.att - p.conv),
                tone: "warning"
              },
              {
                name: "Ignored",
                data: players.map((p) => p.opp - p.att),
                tone: "danger"
              }
            ]}
            horizontal
            stacked
            normalized
            valueSuffix="%"
            height={160}
          />

          <Divider />

          {/* Death traded rate ranked list */}
          <Stack gap={4}>
            <Text size="small" tone="tertiary" weight="semibold">
              Traded when dying
            </Text>
            <BarChart
              categories={[...players]
                .sort(
                  (a, b) => pct(b.traded, b.deaths) - pct(a.traded, a.deaths)
                )
                .map((p) => p.name)}
              series={[
                {
                  name: "Traded rate %",
                  data: [...players]
                    .sort(
                      (a, b) =>
                        pct(b.traded, b.deaths) - pct(a.traded, a.deaths)
                    )
                    .map((p) => pct(p.traded, p.deaths)),
                  tone: "info"
                }
              ]}
              horizontal
              valueSuffix="%"
              height={140}
            />
            <Row gap={16}>
              <Stat
                value={`${tradedRate}%`}
                label="Team traded rate"
                tone={rateTone(tradedRate, 45, 25) as any}
              />
              <Stat value={`${s.traded}/${s.deaths}`} label="Deaths traded" />
            </Row>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   SECTION 2 — Full Player Trade Profile
   ══════════════════════════════════════════════════════ */

function PlayerProfileCard({ p }: { p: P }) {
  const theme = useHostTheme();
  const attRate = pct(p.att, p.opp);
  const convRate = pct(p.conv, p.att);
  const tradedRate = pct(p.traded, p.deaths);
  const fdRate = pct(p.fdTraded, p.fdTradeable || 1);

  return (
    <Card>
      <CardHeader
        trailing={
          <Row gap={6}>
            <Pill tone="success" size="sm">
              {p.conv} converted
            </Pill>
            <Pill tone="danger" size="sm">
              {p.opp - p.att} ignored
            </Pill>
          </Row>
        }
      >
        {p.name}
      </CardHeader>
      <CardBody>
        <Stack gap={12}>
          {/* Opportunity funnel */}
          <Stack gap={4}>
            <Text size="small" tone="tertiary">
              When a teammate dies nearby
            </Text>
            <BarChart
              categories={[p.name]}
              series={[
                { name: "Converted", data: [p.conv], tone: "success" },
                { name: "Failed", data: [p.att - p.conv], tone: "warning" },
                { name: "Ignored", data: [p.opp - p.att], tone: "danger" }
              ]}
              horizontal
              stacked
              normalized
              valueSuffix="%"
              height={52}
            />
            <Grid columns={3} gap={8}>
              <Stat value={p.opp} label="Opportunities" />
              <Stat
                value={`${attRate}%`}
                label="Attempt rate"
                tone={rateTone(attRate) as any}
              />
              <Stat
                value={`${convRate}%`}
                label="Conversion"
                tone={rateTone(convRate, 65, 40) as any}
              />
            </Grid>
          </Stack>

          <Divider />

          {/* Death quality */}
          <Stack gap={4}>
            <Text size="small" tone="tertiary">
              When you die
            </Text>
            <Grid columns={2} gap={8}>
              <Stat
                value={`${tradedRate}%`}
                label="Death traded rate"
                tone={rateTone(tradedRate, 50, 30) as any}
              />
              <Stat
                value={`${fdRate}%`}
                label="FK death traded"
                tone={rateTone(fdRate, 60, 35) as any}
              />
            </Grid>
            <Text size="small" tone="quaternary">
              {p.fdTraded}/{p.fdTradeable} tradeable first-kill deaths were
              avenged
            </Text>
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   SECTION 3 — Who Avenged Whom
   ══════════════════════════════════════════════════════ */

function AvengeTable({
  traders,
  traderTeam,
  opponentNames
}: {
  traders: P[];
  traderTeam: string;
  opponentNames: string[];
}) {
  const rows = traders
    .map((p) => {
      const targets = TRADES[p.name] ?? {};
      const entries = opponentNames
        .map((opp) => ({ opp, n: targets[opp] ?? 0 }))
        .filter((e) => e.n > 0);
      const total = entries.reduce((s, e) => s + e.n, 0);
      if (total === 0) return null;
      return [
        <Text weight="semibold">{p.name}</Text>,
        <Text>{entries.map((e) => `${e.opp} (${e.n}×)`).join("  ·  ")}</Text>,
        <Text weight="bold" tone="secondary">
          {total}
        </Text>
      ];
    })
    .filter(Boolean) as React.ReactNode[][];

  if (rows.length === 0) {
    return (
      <Text tone="tertiary" size="small">
        No trade events recorded for this side.
      </Text>
    );
  }

  return (
    <Table
      headers={[`${traderTeam} trader`, "Punished kills by", "Total"]}
      rows={rows}
      columnAlign={["left", "left", "right"]}
      striped
    />
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════ */
export default function TradeAnalysisPage() {
  const tNames = T.map((p) => p.name);
  const ctNames = CT.map((p) => p.name);

  return (
    <Stack gap={24} style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      {/* Page header */}
      <Stack gap={4}>
        <Text tone="tertiary" size="small">
          Detailed Analysis · Mock data
        </Text>
        <H1>Trades &amp; Trade Efficiency</H1>
        <Text tone="secondary">7dos vs Elisa SOCKS5</Text>
      </Stack>

      <Divider />

      {/* ── Section 1 ── */}
      <H2>Team Trade Discipline</H2>
      <Grid columns={2} gap={16}>
        <TeamDisciplineCard players={T} name={TEAM_A} />
        <TeamDisciplineCard players={CT} name={TEAM_B} />
      </Grid>

      <Divider />

      {/* ── Section 2 ── */}
      <H2>Player Trade Profile</H2>

      <H3>{TEAM_A}</H3>
      <Grid columns={2} gap={12}>
        {T.map((p) => (
          <PlayerProfileCard key={p.name} p={p} />
        ))}
      </Grid>

      <H3>{TEAM_B}</H3>
      <Grid columns={2} gap={12}>
        {CT.map((p) => (
          <PlayerProfileCard key={p.name} p={p} />
        ))}
      </Grid>

      <Divider />

      {/* ── Section 3 ── */}
      <H2>Who Avenged Whom</H2>
      <Text tone="secondary">
        Each row shows a player who traded (killed the opponent who had just
        killed a teammate), which opponents they punished, and how many times.
      </Text>

      <Stack gap={8}>
        <H3>
          {TEAM_A} avenging against {TEAM_B}
        </H3>
        <AvengeTable traders={T} traderTeam={TEAM_A} opponentNames={ctNames} />
      </Stack>

      <Stack gap={8}>
        <H3>
          {TEAM_B} avenging against {TEAM_A}
        </H3>
        <AvengeTable traders={CT} traderTeam={TEAM_B} opponentNames={tNames} />
      </Stack>
    </Stack>
  );
}
