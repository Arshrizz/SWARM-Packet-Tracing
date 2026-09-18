/* TypeScript types mirroring backend response shapes */

export interface TopologyNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  weight: number;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface Packet {
  id: string;
  source: string;
  destination: string;
}

export interface ACOParams {
  num_ants: number;
  iterations: number;
  evaporation_rate: number;
}

export interface TraditionalResult {
  path: string[];
  cost: number;
  hops: number;
}

export interface ConvergencePoint {
  iteration: number;
  best_cost: number | null;
}

export interface SwarmResult {
  path: string[];
  cost: number | null;
  hops: number;
  converged_at_iteration: number;
  overhead_packets_sent: number;
  convergence_history: ConvergencePoint[];
}

export interface PacketSimulationResult {
  packet_id: string;
  traditional: TraditionalResult;
  swarm: SwarmResult;
}

export interface SimulateResponse {
  mode: string;
  results: PacketSimulationResult[];
}
