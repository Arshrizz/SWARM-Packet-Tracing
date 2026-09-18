"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Network, Share2 } from "lucide-react";

import type {
  TopologyNode,
  TopologyEdge,
  PacketSimulationResult,
} from "../lib/types";
import EdgeModal from "./EdgeModal";

/* ============================================================
   Custom Node — Clean circle for dark theme
   ============================================================ */

function RouterNode({ data }: NodeProps) {
  const isSource = data.isSource as boolean;
  const isDest = data.isDest as boolean;

  // Dark-theme colour decisions
  let borderColor = "rgba(148, 163, 184, 0.25)";
  let bgGradient = "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
  let glowShadow = "none";
  let labelColor = "#f1f5f9";
  let ringAnimation: React.CSSProperties = {};

  if (isSource) {
    borderColor = "#06b6d4";
    glowShadow = "0 0 20px rgba(6, 182, 212, 0.55)";
    bgGradient = "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, #0f172a 100%)";
    labelColor = "#06b6d4";
    ringAnimation = { animation: "ant-pulse 1.8s ease-out infinite" };
  } else if (isDest) {
    borderColor = "#f59e0b";
    glowShadow = "0 0 20px rgba(245, 158, 11, 0.55)";
    bgGradient = "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, #0f172a 100%)";
    labelColor = "#f59e0b";
    ringAnimation = { animation: "ant-pulse-dest 1.8s ease-out infinite" };
  }

  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: bgGradient,
        border: `2px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: glowShadow,
        transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        ...ringAnimation,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Indicator dot for source/dest */}
      {(isSource || isDest) && (
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isSource ? "#06b6d4" : "#f59e0b",
            boxShadow: `0 0 8px ${isSource ? "rgba(6,182,212,0.8)" : "rgba(245,158,11,0.8)"}`,
            border: "1.5px solid #0f172a",
          }}
        />
      )}

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: labelColor,
            lineHeight: 1,
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        >
          {data.label as string}
        </div>
        {(isSource || isDest) && (
          <div
            style={{
              fontSize: 8,
              color: isSource ? "rgba(6,182,212,0.7)" : "rgba(245,158,11,0.7)",
              fontWeight: 600,
              marginTop: 2,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {isSource ? "SRC" : "DST"}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { router: RouterNode };


/* ============================================================
   Component
   ============================================================ */

interface TopologyCanvasProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  simulationResult: PacketSimulationResult | null;
  onTopologyChange?: (nodes: TopologyNode[], edges: TopologyEdge[]) => void;
}

const EMPTY_ARRAY: string[] = [];

export default function TopologyCanvas({
  nodes,
  edges,
  simulationResult,
  onTopologyChange,
}: TopologyCanvasProps) {
  const [flowNodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<TopologyEdge | null>(null);

  const tradPath = simulationResult?.traditional.path ?? EMPTY_ARRAY;
  const swarmPath = simulationResult?.swarm.path ?? EMPTY_ARRAY;

  const tradEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < tradPath.length - 1; i++) {
      const a = tradPath[i], b = tradPath[i + 1];
      keys.add(`${a}-${b}`); keys.add(`${b}-${a}`);
    }
    return keys;
  }, [tradPath]);

  const swarmEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < swarmPath.length - 1; i++) {
      const a = swarmPath[i], b = swarmPath[i + 1];
      keys.add(`${a}-${b}`); keys.add(`${b}-${a}`);
    }
    return keys;
  }, [swarmPath]);

  const sourceId = simulationResult ? tradPath[0] ?? swarmPath[0] ?? null : null;
  const destId = simulationResult
    ? tradPath[tradPath.length - 1] ?? swarmPath[swarmPath.length - 1] ?? null
    : null;

  // Sync props to ReactFlow local state
  useEffect(() => {
    const newFlowNodes: Node[] = nodes.map((n) => ({
      id: n.id,
      type: "router",
      position: { x: n.x ?? Math.random() * 300, y: n.y ?? Math.random() * 300 },
      data: { label: n.id, fullLabel: n.label, isSource: n.id === sourceId, isDest: n.id === destId },
    }));
    setNodes(newFlowNodes);
  }, [nodes, sourceId, destId, setNodes]);

  useEffect(() => {
    const newFlowEdges: Edge[] = edges.map((e) => {
      const key = `${e.source}-${e.target}`;
      const isSwarm = swarmEdgeKeys.has(key);
      const isTrad = tradEdgeKeys.has(key);

      let strokeColor = "rgba(148, 163, 184, 0.2)";
      let strokeWidth = 1.5;
      let animated = false;
      let className = "";

      if (isSwarm && isTrad) {
        strokeColor = "#06b6d4";
        strokeWidth = 3; animated = true; className = "animated-edge-swarm";
      } else if (isSwarm) {
        strokeColor = "#06b6d4";
        strokeWidth = 3; animated = true; className = "animated-edge-swarm";
      } else if (isTrad) {
        strokeColor = "#f59e0b";
        strokeWidth = 3; animated = true; className = "animated-edge-trad";
      }

      return {
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: "straight",
        animated,
        className,
        label: String(e.weight),
        labelStyle: {
          fill: "#94a3b8",
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "var(--font-geist-mono, monospace)",
        },
        labelBgStyle: {
          fill: "#0a0e1a",
          fillOpacity: 0.85,
        },
        labelBgPadding: [4, 5] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          stroke: strokeColor,
          strokeWidth,
          cursor: "pointer",
        },
      };
    });
    setEdges(newFlowEdges);
  }, [edges, swarmEdgeKeys, tradEdgeKeys, setEdges]);

  // Handle saving dragged positions
  const handleNodeDragStop = useCallback(() => {
    if (!onTopologyChange) return;
    const updatedNodes = nodes.map(n => {
      const fn = flowNodes.find(fn => fn.id === n.id);
      return fn ? { ...n, x: fn.position.x, y: fn.position.y } : n;
    });
    onTopologyChange(updatedNodes, edges);
  }, [nodes, edges, flowNodes, onTopologyChange]);

  // Handle adding elements
  const handleAddNode = useCallback(() => {
    if (!onTopologyChange) return;
    const currentIds = new Set(nodes.map(n => n.id));
    let nextChar = 'A';
    while (currentIds.has(nextChar)) {
      nextChar = String.fromCharCode(nextChar.charCodeAt(0) + 1);
    }
    const newNode: TopologyNode = {
      id: nextChar,
      label: `Router ${nextChar}`,
      x: 300,
      y: 300,
    };
    onTopologyChange([...nodes, newNode], edges);
  }, [nodes, edges, onTopologyChange]);

  const handleAddEdgeClick = () => {
    setEditingEdge(null);
    setIsEdgeModalOpen(true);
  };

  const handleEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    const topoEdge = edges.find(e => e.source === edge.source && e.target === edge.target);
    if (topoEdge) {
      setEditingEdge(topoEdge);
      setIsEdgeModalOpen(true);
    }
  };

  const handleSaveEdge = (source: string, target: string, weight: number) => {
    if (!onTopologyChange) return;
    const newEdges = [...edges];
    const existingIndex = newEdges.findIndex(e => 
      (e.source === source && e.target === target) || 
      (e.source === target && e.target === source)
    );

    if (existingIndex >= 0) {
      newEdges[existingIndex] = { source, target, weight };
    } else {
      newEdges.push({ source, target, weight });
    }
    onTopologyChange(nodes, newEdges);
  };

  const hasResult = !!simulationResult;

  return (
    <div
      className="glass-card"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.4}
        maxZoom={2}
        nodesDraggable={true}
        nodesConnectable={false}
      >
        <Background color="rgba(148, 163, 184, 0.06)" gap={28} size={1} />
        <Controls showInteractive={false} style={{ borderRadius: 8 }} />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as any;
            if (d?.isSource) return "#06b6d4";
            if (d?.isDest) return "#f59e0b";
            return "#1e293b";
          }}
          maskColor="rgba(10, 14, 26, 0.8)"
          style={{ borderRadius: 8 }}
        />

        {/* Legend */}
        <Panel position="top-left">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              padding: "10px 14px",
              background: "rgba(10, 14, 26, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148, 163, 184, 0.1)",
              borderRadius: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              fontSize: 11,
              fontWeight: 500,
              color: "#94a3b8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 20, height: 3,
                  background: "#06b6d4", borderRadius: 2,
                  boxShadow: "0 0 8px rgba(6,182,212,0.6)",
                }}
              />
              <span>SWARM (ACO)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 20, height: 3,
                  background: "#f59e0b", borderRadius: 2,
                  boxShadow: "0 0 8px rgba(245,158,11,0.6)",
                }}
              />
              <span>Traditional (Dijkstra)</span>
            </div>
            {hasResult && (
              <>
                <div style={{ height: 1, background: "rgba(148,163,184,0.12)", margin: "2px 0" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#06b6d4", border: "2px solid #0f172a",
                    boxShadow: "0 0 6px rgba(6,182,212,0.7)", flexShrink: 0,
                  }} />
                  <span>Source node</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#f59e0b", border: "2px solid #0f172a",
                    boxShadow: "0 0 6px rgba(245,158,11,0.7)", flexShrink: 0,
                  }} />
                  <span>Destination node</span>
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* Add Controls */}
        <Panel position="top-right">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "8px",
              background: "rgba(10, 14, 26, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(148, 163, 184, 0.1)",
              borderRadius: 10,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <button
              onClick={handleAddNode}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Add Node"
            >
              <Plus size={14} style={{ color: "var(--swarm)" }} />
              <Network size={14} />
            </button>
            <button
              onClick={handleAddEdgeClick}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Add Edge"
            >
              <Plus size={14} style={{ color: "var(--trad)" }} />
              <Share2 size={14} />
            </button>
          </div>
        </Panel>
      </ReactFlow>

      <EdgeModal
        isOpen={isEdgeModalOpen}
        onClose={() => setIsEdgeModalOpen(false)}
        onSave={handleSaveEdge}
        nodes={nodes}
        initialEdge={editingEdge}
      />
    </div>
  );
}
