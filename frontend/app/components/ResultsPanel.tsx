"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from "recharts";
import {
  Route,
  Timer,
  Layers,
  TrendingDown,
  Activity,
  BarChart3,
  Trophy,
  Zap,
  ArrowRight,
} from "lucide-react";

import type { PacketSimulationResult } from "../lib/types";

interface ResultsPanelProps {
  result: PacketSimulationResult | null;
  mode: "static" | "dynamic";
}

export default function ResultsPanel({ result, mode }: ResultsPanelProps) {
  if (!result) {
    return (
      <div
        className="glass-card"
        style={{
          padding: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          height: "100%",
          minHeight: 300,
          textAlign: "center",
        }}
      >
        <div className="float">
          <BarChart3 size={44} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
            The Duel Awaits
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 210 }}>
            Add a packet and run the simulation to watch{" "}
            <span style={{ color: "var(--swarm)" }}>SWARM</span>{" challenge "}
            <span style={{ color: "var(--trad)" }}>Dijkstra</span>
          </div>
        </div>
      </div>
    );
  }

  const trad = result.traditional;
  const swarm = result.swarm;

  // Convergence chart data — filter out null costs
  const chartData = swarm.convergence_history
    .filter((cp) => cp.best_cost !== null)
    .map((cp) => ({
      iteration: cp.iteration,
      cost: cp.best_cost,
    }));

  // Winner logic
  const swarmCost = swarm.cost;
  const tradCost = trad.cost;
  let winnerState: "swarm-wins" | "trad-wins" | "tied" = "tied";
  let winnerLabel = "";
  let deltaText = "";
  let winnerIcon = <Trophy size={16} />;

  if (swarmCost != null && tradCost > 0) {
    if (swarmCost < tradCost) {
      winnerState = "swarm-wins";
      const pct = Math.round(((tradCost - swarmCost) / tradCost) * 100);
      winnerLabel = "SWARM wins!";
      deltaText = `↓ ${pct}% lower cost (${swarmCost} vs ${tradCost})`;
    } else if (tradCost < swarmCost) {
      winnerState = "trad-wins";
      const pct = Math.round(((swarmCost - tradCost) / swarmCost) * 100);
      winnerLabel = "Dijkstra wins!";
      deltaText = `↓ ${pct}% lower cost (${tradCost} vs ${swarmCost})`;
    } else {
      winnerState = "tied";
      winnerLabel = "It's a tie!";
      deltaText = `Both found cost ${tradCost}`;
    }
  }

  return (
    <div
      className="animate-in"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Activity size={18} style={{ color: "var(--swarm)" }} />
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Results
          <span
            style={{
              marginLeft: 8,
              fontFamily: "var(--font-geist-mono, monospace)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
            }}
          >
            {result.packet_id}
          </span>
        </h2>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 6,
            background:
              mode === "dynamic"
                ? "var(--trad-subtle)"
                : "var(--swarm-subtle)",
            color: mode === "dynamic" ? "var(--trad)" : "var(--swarm)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            border: `1px solid ${mode === "dynamic" ? "rgba(245,158,11,0.2)" : "rgba(6,182,212,0.2)"}`,
          }}
        >
          {mode}
        </span>
      </div>

      {/* ---- Winner Badge ---- */}
      {winnerLabel && (
        <div className={`winner-badge ${winnerState}`}>
          {winnerIcon}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
              {winnerLabel}
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 1 }}>
              {deltaText}
            </div>
          </div>
        </div>
      )}

      {/* ---- Metric Cards ---- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Traditional Card */}
        <div className="metric-card trad">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "var(--trad-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingDown size={13} style={{ color: "var(--trad)" }} />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--trad)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Dijkstra
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <MetricRow icon={<Route size={13} />} label="Path" value={trad.path.join(" → ")} mono />
            <MetricRow icon={<TrendingDown size={13} />} label="Cost" value={String(trad.cost)} highlight="trad" />
            <MetricRow icon={<Layers size={13} />} label="Hops" value={String(trad.hops)} />
          </div>
        </div>

        {/* Swarm Card */}
        <div className="metric-card swarm">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "var(--swarm-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={13} style={{ color: "var(--swarm)" }} />
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--swarm)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              ACO Swarm
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <MetricRow icon={<Route size={13} />} label="Path" value={swarm.path.join(" → ")} mono />
            <MetricRow
              icon={<TrendingDown size={13} />}
              label="Cost"
              value={swarm.cost != null ? String(swarm.cost) : "N/A"}
              highlight="swarm"
            />
            <MetricRow icon={<Layers size={13} />} label="Hops" value={String(swarm.hops)} />
            <MetricRow icon={<Timer size={13} />} label="Converged" value={`Iter ${swarm.converged_at_iteration}`} />
            <MetricRow icon={<Zap size={13} />} label="Overhead" value={`${swarm.overhead_packets_sent} pkts`} />
          </div>
        </div>
      </div>

      {/* ---- Convergence Chart ---- */}
      <div className="glass-card" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div className="section-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={11} />
            ACO Convergence Curve
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 16, height: 2, background: "var(--swarm)", display: "inline-block", borderRadius: 1 }} />
              ACO
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 16, height: 2, background: "var(--trad)", display: "inline-block", borderRadius: 1, opacity: 0.7, borderTop: "2px dashed var(--trad)" }} />
              Dijkstra
            </span>
          </div>
        </div>
        <div style={{ width: "100%", height: 210 }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 16, bottom: 16, left: 0 }}
            >
              <defs>
                <linearGradient id="acoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--swarm)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--swarm)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.07)"
                vertical={false}
              />
              <XAxis
                dataKey="iteration"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                label={{
                  value: "Iteration",
                  position: "insideBottom",
                  offset: -8,
                  style: { fill: "var(--text-muted)", fontSize: 10 },
                }}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={32}
                label={{
                  value: "Cost",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "var(--text-muted)", fontSize: 10 },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--text-primary)",
                  boxShadow: "var(--shadow-md)",
                }}
                labelStyle={{ color: "var(--text-secondary)", fontSize: 11 }}
                labelFormatter={(v) => `Iteration ${v}`}
                formatter={(v: any) => [v, "Best Cost"]}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--swarm)"
                strokeWidth={2.5}
                fill="url(#acoGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--swarm)",
                  stroke: "var(--bg-primary)",
                  strokeWidth: 2,
                }}
              />
              {/* Dijkstra baseline */}
              {trad.cost > 0 && (
                <ReferenceLine
                  y={trad.cost}
                  stroke="var(--trad)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Dijkstra: ${trad.cost}`,
                    fill: "var(--trad)",
                    fontSize: 10,
                    position: "right",
                  }}
                />
              )}
              {/* Disruption marker in dynamic mode */}
              {mode === "dynamic" && (
                <ReferenceLine
                  x={15}
                  stroke="var(--danger)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "⚡ Disruption",
                    fill: "var(--danger)",
                    fontSize: 10,
                    position: "top",
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---- Metric Row sub-component ---- */

function MetricRow({
  icon,
  label,
  value,
  highlight,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: "swarm" | "trad";
  mono?: boolean;
}) {
  let valueColor = "var(--text-primary)";
  if (highlight === "swarm") valueColor = "var(--swarm)";
  if (highlight === "trad") valueColor = "var(--trad)";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
      <div style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          minWidth: 58,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: valueColor,
          fontFamily: mono ? "var(--font-geist-mono, monospace)" : "inherit",
          wordBreak: "break-all",
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
}
