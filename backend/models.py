"""
Pydantic models for request/response validation.
Mirrors the API contract from GEMINI.md.
"""

from pydantic import BaseModel, Field


# --- Topology ---

class NodeModel(BaseModel):
    id: str
    label: str
    x: float | None = None
    y: float | None = None


class EdgeModel(BaseModel):
    source: str
    target: str
    weight: float = 1.0


class TopologyResponse(BaseModel):
    nodes: list[NodeModel]
    edges: list[EdgeModel]


class TopologyRequest(BaseModel):
    nodes: list[NodeModel]
    edges: list[EdgeModel]


# --- Packets ---

class PacketRequest(BaseModel):
    source: str
    destination: str


class PacketResponse(BaseModel):
    id: str
    source: str
    destination: str


# --- Simulation ---

class ACOParams(BaseModel):
    num_ants: int = Field(default=20, ge=5, le=50)
    iterations: int = Field(default=50, ge=10, le=200)
    evaporation_rate: float = Field(default=0.1, ge=0.01, le=0.5)


class SimulateRequest(BaseModel):
    mode: str = "static"  # "static" | "dynamic"
    aco_params: ACOParams = ACOParams()


class TraditionalResult(BaseModel):
    path: list[str]
    cost: float
    hops: int


class ConvergencePoint(BaseModel):
    iteration: int
    best_cost: float | None


class SwarmResult(BaseModel):
    path: list[str]
    cost: float | None
    hops: int
    converged_at_iteration: int
    overhead_packets_sent: int
    convergence_history: list[ConvergencePoint]


class PacketSimulationResult(BaseModel):
    packet_id: str
    traditional: TraditionalResult
    swarm: SwarmResult


class SimulateResponse(BaseModel):
    mode: str
    results: list[PacketSimulationResult]
