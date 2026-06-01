"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ─── design token shortcuts ─────────────────────────────────────── */
export const TEAM_A_COLOR = "var(--analysis-team-a)";
export const TEAM_B_COLOR = "var(--analysis-team-b)";
export const GOOD_COLOR = "var(--analysis-good)";
export const BAD_COLOR = "var(--analysis-bad)";

/* ─── TeamDot ────────────────────────────────────────────────────── */
export function TeamDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <i
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 9999,
        background: color,
        flexShrink: 0
      }}
    />
  );
}

/* ─── AnalysisCard ───────────────────────────────────────────────── */
interface AnalysisCardProps {
  title?: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export function AnalysisCard({
  title,
  sub,
  right,
  children,
  className
}: AnalysisCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card overflow-hidden",
        className
      )}
    >
      {(title || right) && (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 px-4 py-3 border-b border-border/40">
          <div className="flex flex-col gap-0.5 min-w-0">
            {title && (
              <h3 className="font-headings text-sm text-foreground m-0 leading-tight">
                {title}
              </h3>
            )}
            {sub && (
              <span className="text-[11px] text-muted-foreground/70 leading-snug">
                {sub}
              </span>
            )}
          </div>
          {right && <div className="sm:ml-auto shrink-0 w-fit">{right}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ─── KpiNum ─────────────────────────────────────────────────────── */
interface KpiNumProps {
  value: string | number;
  unit?: string;
  label?: string;
  sub?: string;
  color?: string;
  align?: "left" | "center" | "right";
}
export function KpiNum({
  value,
  unit,
  label,
  sub,
  color = "var(--foreground)",
  align = "left"
}: KpiNumProps) {
  return (
    <div className="flex flex-col gap-0.5" style={{ textAlign: align }}>
      {label && (
        <span className="text-[11px] text-muted-foreground/70">{label}</span>
      )}
      <span
        className="text-3xl leading-none font-bold tabular-nums"
        style={{ color }}
      >
        {value}
        {unit && (
          <span className="text-base font-normal text-muted-foreground ml-0.5">
            {unit}
          </span>
        )}
      </span>
      {sub && (
        <span className="text-[11px] text-muted-foreground/50">{sub}</span>
      )}
    </div>
  );
}

/* ─── VersusStat ─────────────────────────────────────────────────── */
type VersusMode = "share" | "pct" | "max";
interface VersusStatProps {
  label: string;
  aVal: number;
  bVal: number;
  aText?: string;
  bText?: string;
  mode?: VersusMode;
  teamAColor?: string;
  teamBColor?: string;
}
export function VersusStat({
  label,
  aVal,
  bVal,
  aText,
  bText,
  mode = "share",
  teamAColor = TEAM_A_COLOR,
  teamBColor = TEAM_B_COLOR
}: VersusStatProps) {
  let fa: number;
  if (mode === "share") {
    const total = aVal + bVal;
    fa = total === 0 ? 0.5 : aVal / total;
  } else if (mode === "pct") {
    fa = aVal / 100;
  } else {
    const total = aVal + bVal;
    fa = total === 0 ? 0.5 : aVal / total;
  }
  const aWin = aVal >= bVal;
  const bWin = bVal > aVal;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="grid items-center gap-2.5"
        style={{ gridTemplateColumns: "auto 1fr auto" }}
      >
        <span
          className="text-xs tabular-nums font-semibold"
          style={{ color: aWin ? teamAColor : "var(--muted-foreground)" }}
        >
          {aText ?? aVal}
        </span>
        <div
          className="flex h-2.5 rounded-full overflow-hidden"
          style={{ gap: 1 }}
        >
          <div
            style={{
              flex: `0 0 ${fa * 100}%`,
              background: aWin
                ? teamAColor
                : `color-mix(in oklab, ${teamAColor} 35%, transparent)`,
              borderRadius: "9999px 2px 2px 9999px"
            }}
          />
          <div
            style={{
              flex: `0 0 ${(1 - fa) * 100}%`,
              background: bWin
                ? teamBColor
                : `color-mix(in oklab, ${teamBColor} 35%, transparent)`,
              borderRadius: "2px 9999px 9999px 2px"
            }}
          />
        </div>
        <span
          className="text-xs tabular-nums font-semibold"
          style={{ color: bWin ? teamBColor : "var(--muted-foreground)" }}
        >
          {bText ?? bVal}
        </span>
      </div>
      <div className="text-center text-[11px] text-muted-foreground/60">
        {label}
      </div>
    </div>
  );
}

/* ─── SegmentBar ─────────────────────────────────────────────────── */
interface Segment {
  label: string;
  value: number;
  color: string;
}
export function SegmentBar({
  segments,
  height = 14,
  showPct = true
}: {
  segments: Segment[];
  height?: number;
  showPct?: boolean;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return (
    <div
      className="flex w-full overflow-hidden rounded-full"
      style={{ height, background: "var(--muted)" }}
    >
      {segments.map((s, i) => {
        const pct = total === 0 ? 0 : (s.value / total) * 100;
        return (
          <div
            key={i}
            style={{
              width: `${pct}%`,
              background: s.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius:
                i === 0
                  ? "9999px 0 0 9999px"
                  : i === segments.length - 1
                    ? "0 9999px 9999px 0"
                    : 0
            }}
          >
            {showPct && pct > 10 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(0,0,0,0.6)",
                  lineHeight: 1
                }}
              >
                {Math.round(pct)}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MiniBar ────────────────────────────────────────────────────── */
export function MiniBar({
  value,
  max,
  color = "var(--muted-foreground)",
  height = 7
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div
      className="flex-1 rounded-full overflow-hidden"
      style={{ height, background: "var(--muted)" }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 9999
        }}
      />
    </div>
  );
}

/* ─── Legend ─────────────────────────────────────────────────────── */
interface LegendItem {
  label: string;
  color: string;
}
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <i
            aria-hidden
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: it.color,
              display: "inline-block"
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ─── HeatGrid ───────────────────────────────────────────────────── */
interface HeatGridProps {
  rows: string[];
  cols: string[];
  rowLabel: (id: string) => string;
  colLabel: (id: string) => string;
  get: (row: string, col: string) => number;
  color?: string;
  max?: number;
  cornerRow?: string;
  cornerCol?: string;
  minWidth?: number;
  cellH?: number;
}
export function HeatGrid({
  rows,
  cols,
  rowLabel,
  colLabel,
  get,
  color = "var(--analysis-team-a)",
  max,
  cornerRow = "↓",
  cornerCol = "→",
  minWidth = 420,
  cellH = 38
}: HeatGridProps) {
  const values = rows.flatMap((r) => cols.map((c) => get(r, c)));
  const mx = max ?? Math.max(1, ...values);

  function cellBg(v: number) {
    if (v <= 0) return "var(--muted)";
    const alpha = Math.round((0.12 + (0.6 * Math.min(v, mx)) / mx) * 100);
    return `color-mix(in oklab, ${color} ${alpha}%, transparent)`;
  }

  const cellW = 56;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed"
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: 110,
                  textAlign: "left",
                  paddingBottom: 4,
                  fontSize: 10,
                  color: "var(--muted-foreground)",
                  verticalAlign: "bottom"
                }}
              >
                {cornerRow}
              </th>
              {cols.map((c) => (
                <th
                  key={c}
                  style={{
                    width: cellW,
                    textAlign: "center",
                    paddingBottom: 4,
                    fontSize: 10,
                    color: "var(--muted-foreground)",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={colLabel(c)}
                >
                  {colLabel(c)}
                </th>
              ))}
            </tr>
            <tr>
              <td
                colSpan={cols.length + 1}
                style={{
                  fontSize: 10,
                  color: "var(--muted-foreground)",
                  paddingBottom: 2,
                  opacity: 0.5
                }}
              >
                {cornerCol}
              </td>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td
                  style={{
                    fontSize: 11,
                    color: "var(--foreground)",
                    fontWeight: 600,
                    paddingRight: 8,
                    height: cellH,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 110
                  }}
                  title={rowLabel(r)}
                >
                  {rowLabel(r)}
                </td>
                {cols.map((c) => {
                  const v = get(r, c);
                  return (
                    <td
                      key={c}
                      style={{
                        width: cellW,
                        height: cellH,
                        textAlign: "center",
                        background: cellBg(v),
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: v > 0 ? 700 : 400,
                        color:
                          v > 0
                            ? "var(--foreground)"
                            : "var(--muted-foreground)"
                      }}
                    >
                      {v > 0 ? v : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
