"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Network, Cpu, Activity, CheckCircle2, Loader2 } from "lucide-react";

import TopologyCanvas from "./components/TopologyCanvas";
import ControlPanel from "./components/ControlPanel";
import ResultsPanel from "./components/ResultsPanel";

import * as api from "./lib/api";
import type {
  Topology,
  Packet,
  ACOParams,
  PacketSimulationResult,
} from "./lib/types";

export default function Home() {
  // State
  const [topology, setTopology] = useState<Topology>({
    nodes: [],
    edges: [],
  });
  const [packets, setPackets] = useState<Packet[]>([]);
  const [mode, setMode] = useState<"static" | "dynamic">("static");
  const [acoParams, setACOParams] = useState<ACOParams>({
    num_ants: 20,
    iterations: 50,
    evaporation_rate: 0.1,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PacketSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load topology on mount
  useEffect(() => {
    api
      .getTopology()
      .then(setTopology)
      .catch((e) => setError(e.message));

    api
      .getPackets()
      .then(setPackets)
      .catch(() => {}); // OK if no packets yet
  }, []);

  // Handlers
  const handleAddPacket = useCallback(
    async (source: string, destination: string) => {
      try {
        setError(null);
        const pkt = await api.addPacket(source, destination);
        setPackets((prev) => [...prev, pkt]);
      } catch (e: any) {
        setError(e.message);
      }
    },
    []
  );

  const handleTopologyChange = useCallback(async (newNodes: TopologyNode[], newEdges: TopologyEdge[]) => {
    try {
      const newTopology = { nodes: newNodes, edges: newEdges };
      setTopology(newTopology);
      await api.setTopology(newTopology);
    } catch (e: any) {
      setError("Failed to save topology: " + e.message);
    }
  }, []);

  const handleDeletePacket = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.deletePacket(id);
      setPackets((prev) => prev.filter((p) => p.id !== id));
      setResult(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const handleRun = useCallback(async () => {
    try {
      setError(null);
      setIsRunning(true);
      setResult(null);

      const response = await api.runSimulation(mode, acoParams);

      // Show first packet result (can extend to multi-packet view later)
      if (response.results.length > 0) {
        setResult(response.results[0]);
      }

      // Reload topology in case dynamic mode altered it (backend restores, but re-fetch)
      const topo = await api.getTopology();
      setTopology(topo);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsRunning(false);
    }
  }, [mode, acoParams]);

  // Derive status
  const status: "ready" | "running" | "results" = isRunning
    ? "running"
    : result
    ? "results"
    : "ready";

  const statusLabel = {
    ready: "Ready",
    running: "Simulating…",
    results: "Results Ready",
  }[status];

  const StatusIcon = {
    ready: CheckCircle2,
    running: Loader2,
    results: Activity,
  }[status];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        padding: "16px 20px",
        gap: 16,
      }}
    >
      {/* Hero Header */}
      <header className="hero-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Logo mark */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--swarm) 0%, #0891b2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-glow-swarm)",
              flexShrink: 0,
            }}
          >
            <Network size={22} color="white" />
          </div>
          {/* Title block */}
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "var(--swarm)" }}>SWARM</span>
              <span style={{ color: "var(--text-muted)", fontWeight: 400, margin: "0 8px", fontSize: 16 }}>vs</span>
              <span>Traditional</span>
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                margin: "2px 0 0",
                fontWeight: 400,
              }}
            >
              Ant Colony Optimization vs Dijkstra — Network Packet Routing
            </p>
          </div>
        </div>

        {/* Right: stats + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Live stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(148, 163, 184, 0.04)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Cpu size={13} style={{ color: "var(--text-muted)" }} />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-geist-mono, monospace)",
              }}
            >
              {topology.nodes.length} nodes · {topology.edges.length} links
            </span>
          </div>
          {/* Status pill */}
          <div className={`status-pill ${status}`}>
            <div className={`status-dot${status === "running" ? " pulsing" : ""}`} />
            <StatusIcon
              size={12}
              style={status === "running" ? { animation: "spin 1s linear infinite" } : undefined}
            />
            {statusLabel}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "var(--danger)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
              fontSize: 16,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Layout: 3-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr 400px",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left: Control Panel */}
        <div style={{ minHeight: 0, overflowY: "auto" }}>
          <ControlPanel
            nodes={topology.nodes}
            packets={packets}
            mode={mode}
            acoParams={acoParams}
            isRunning={isRunning}
            onAddPacket={handleAddPacket}
            onDeletePacket={handleDeletePacket}
            onModeChange={setMode}
            onACOParamsChange={setACOParams}
            onRun={handleRun}
          />
        </div>

        {/* Center: Topology Canvas */}
        <div style={{ minHeight: 500, position: "relative" }}>
          <ReactFlowProvider>
            <TopologyCanvas
              nodes={topology.nodes}
              edges={topology.edges}
              simulationResult={result}
              onTopologyChange={handleTopologyChange}
            />
          </ReactFlowProvider>
        </div>

        {/* Right: Results */}
        <div style={{ minHeight: 0, overflowY: "auto" }}>
          <ResultsPanel result={result} mode={mode} />
        </div>
      </div>
    </div>
  );
}
