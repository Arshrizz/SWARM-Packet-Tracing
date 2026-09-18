import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import type { TopologyNode, TopologyEdge } from "../lib/types";

interface EdgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (source: string, target: string, weight: number) => void;
  nodes: TopologyNode[];
  initialEdge?: TopologyEdge | null;
}

export default function EdgeModal({
  isOpen,
  onClose,
  onSave,
  nodes,
  initialEdge,
}: EdgeModalProps) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEdge) {
        setSource(initialEdge.source);
        setTarget(initialEdge.target);
        setWeight(initialEdge.weight.toString());
      } else {
        setSource("");
        setTarget("");
        setWeight("1");
      }
      setError(null);
    }
  }, [isOpen, initialEdge]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!source || !target) {
      setError("Please select both source and destination nodes.");
      return;
    }
    if (source === target) {
      setError("Source and destination must be different.");
      return;
    }
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      setError("Weight must be a positive number.");
      return;
    }
    onSave(source, target, numWeight);
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(10, 14, 26, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="glass-card"
        style={{
          width: 320,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}>
            {initialEdge ? "Edit Edge" : "Add Edge"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Source Node
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
              disabled={!!initialEdge}
            >
              <option value="">Select source</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Destination Node
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
              disabled={!!initialEdge}
            >
              <option value="">Select destination</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Weight
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="1"
              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Check size={14} />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
