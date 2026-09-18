"use client";

import React from "react";
import {
  Play,
  Trash2,
  Plus,
  Zap,
  Settings,
  Bug,
  Shield,
  Package,
  Antenna,
  RefreshCw,
  Gauge,
  Users,
} from "lucide-react";

import type { TopologyNode, Packet, ACOParams } from "../lib/types";

interface ControlPanelProps {
  nodes: TopologyNode[];
  packets: Packet[];
  mode: "static" | "dynamic";
  acoParams: ACOParams;
  isRunning: boolean;
  onAddPacket: (source: string, destination: string) => void;
  onDeletePacket: (id: string) => void;
  onModeChange: (mode: "static" | "dynamic") => void;
  onACOParamsChange: (params: ACOParams) => void;
  onRun: () => void;
}

export default function ControlPanel({
  nodes,
  packets,
  mode,
  acoParams,
  isRunning,
  onAddPacket,
  onDeletePacket,
  onModeChange,
  onACOParamsChange,
  onRun,
}: ControlPanelProps) {
  const [source, setSource] = React.useState("");
  const [destination, setDestination] = React.useState("");

  const handleAdd = () => {
    if (source && destination && source !== destination) {
      onAddPacket(source, destination);
      setSource("");
      setDestination("");
    }
  };

  return (
    <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "rgba(6, 182, 212, 0.1)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={16} style={{ color: "var(--swarm)" }} />
        </div>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Control Panel
        </h2>
      </div>

      {/* ---- Add Packet ---- */}
      <div>
        <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Package size={11} />
          Add Packet
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Source</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
          <span style={{ color: "var(--swarm)", fontSize: 14, flexShrink: 0 }}>→</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Dest</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id}
              </option>
            ))}
          </select>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={!source || !destination || source === destination}
            style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ---- Active Packets ---- */}
      <div>
        <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={11} />
          Active Packets
          <span
            style={{
              marginLeft: 4,
              padding: "1px 7px",
              borderRadius: 10,
              background: packets.length > 0 ? "var(--swarm-subtle)" : "rgba(100,116,139,0.1)",
              border: `1px solid ${packets.length > 0 ? "rgba(6,182,212,0.2)" : "var(--border)"}`,
              fontSize: 10,
              fontWeight: 700,
              color: packets.length > 0 ? "var(--swarm)" : "var(--text-muted)",
              fontFamily: "var(--font-geist-mono, monospace)",
            }}
          >
            {packets.length}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {packets.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px 12px",
                background: "rgba(148, 163, 184, 0.03)",
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <Package size={20} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                No packets yet — select source & destination above
              </span>
            </div>
          )}
          {packets.map((pkt) => (
            <div
              key={pkt.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                transition: "border-color 0.2s var(--ease)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={12} style={{ color: "var(--swarm)", flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono, monospace)",
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                >
                  {pkt.source}
                  <span style={{ color: "var(--swarm)", margin: "0 4px" }}>→</span>
                  {pkt.destination}
                </span>
              </div>
              <button
                className="btn-danger"
                onClick={() => onDeletePacket(pkt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 -4px" }} />

      {/* ---- Mode Toggle ---- */}
      <div>
        <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Antenna size={11} />
          Simulation Mode
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={`mode-pill ${mode === "static" ? "active-static" : ""}`}
            onClick={() => onModeChange("static")}
          >
            <Shield size={13} />
            Static
          </button>
          <button
            className={`mode-pill ${mode === "dynamic" ? "active-dynamic" : ""}`}
            onClick={() => onModeChange("dynamic")}
          >
            <Bug size={13} />
            Dynamic
          </button>
        </div>
        {mode === "dynamic" && (
          <div
            style={{
              marginTop: 8,
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--trad-subtle)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              fontSize: 11,
              color: "var(--trad)",
            }}
          >
            ⚡ Congestion spike injected at iteration 15
          </div>
        )}
      </div>

      {/* ---- ACO Parameters ---- */}
      <div>
        <div className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RefreshCw size={11} />
          ACO Parameters
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Num Ants */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Users size={12} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ants</span>
              </div>
              <span className="stat-pill">{acoParams.num_ants}</span>
            </div>
            <input
              type="range"
              min={5} max={50} step={1}
              value={acoParams.num_ants}
              onChange={(e) => onACOParamsChange({ ...acoParams, num_ants: Number(e.target.value) })}
            />
          </div>

          {/* Iterations */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <RefreshCw size={12} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Iterations</span>
              </div>
              <span className="stat-pill">{acoParams.iterations}</span>
            </div>
            <input
              type="range"
              min={10} max={200} step={5}
              value={acoParams.iterations}
              onChange={(e) => onACOParamsChange({ ...acoParams, iterations: Number(e.target.value) })}
            />
          </div>

          {/* Evaporation Rate */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Gauge size={12} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Evaporation</span>
              </div>
              <span className="stat-pill">{acoParams.evaporation_rate.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.01} max={0.5} step={0.01}
              value={acoParams.evaporation_rate}
              onChange={(e) => onACOParamsChange({ ...acoParams, evaporation_rate: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* ---- Run Button ---- */}
      <button
        className={`btn-run${isRunning ? " running" : ""}`}
        onClick={onRun}
        disabled={isRunning || packets.length === 0}
      >
        {isRunning ? (
          <>
            <div className="spinner" />
            Simulating…
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" />
            Run Simulation
          </>
        )}
      </button>

      {packets.length === 0 && !isRunning && (
        <p
          style={{
            margin: "-12px 0 0",
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Add at least one packet to run
        </p>
      )}
    </div>
  );
}
