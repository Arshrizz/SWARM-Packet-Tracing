"""
FastAPI backend for SWARM vs Traditional packet routing comparison.
Exposes REST endpoints per the API contract in GEMINI.md.
"""

import networkx as nx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from aco import AntColonyOptimizer
from graph_store import GraphStore
from models import (
    TopologyRequest,
    TopologyResponse,
    PacketRequest,
    PacketResponse,
    SimulateRequest,
    SimulateResponse,
    TraditionalResult,
    SwarmResult,
    PacketSimulationResult,
    ConvergencePoint,
)

app = FastAPI(
    title="SWARM vs Traditional Packet Routing",
    description="Compare ACO (swarm intelligence) against Dijkstra for network packet routing",
    version="1.0.0",
)

# CORS — allow Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
store = GraphStore()


# --- Topology Endpoints ---


@app.get("/topology", response_model=TopologyResponse)
def get_topology():
    """Return the current network topology."""
    return store.get_topology()


@app.post("/topology", response_model=TopologyResponse)
def set_topology(req: TopologyRequest):
    """Replace/seed the topology."""
    store.set_topology(req.nodes, req.edges)
    return store.get_topology()


# --- Packet Endpoints ---


@app.post("/packets", response_model=PacketResponse, status_code=201)
def add_packet(req: PacketRequest):
    """Add a packet to route."""
    # Validate nodes exist
    if req.source not in store.graph.nodes:
        raise HTTPException(status_code=400, detail=f"Source node '{req.source}' not in topology")
    if req.destination not in store.graph.nodes:
        raise HTTPException(status_code=400, detail=f"Destination node '{req.destination}' not in topology")
    if req.source == req.destination:
        raise HTTPException(status_code=400, detail="Source and destination must be different")

    pkt = store.add_packet(req.source, req.destination)
    return pkt


@app.get("/packets", response_model=list[PacketResponse])
def list_packets():
    """List all active packets."""
    return store.get_packets()


@app.delete("/packets/{packet_id}", status_code=204)
def delete_packet(packet_id: str):
    """Remove a packet."""
    if not store.delete_packet(packet_id):
        raise HTTPException(status_code=404, detail=f"Packet '{packet_id}' not found")
    return None


# --- Simulation Endpoint ---


@app.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    """
    Run both Dijkstra and ACO on all active packets.

    Static mode: run on unchanged graph.
    Dynamic mode: disrupt edges partway through ACO, re-run Dijkstra on post-change graph.
    """
    if not store.packets:
        raise HTTPException(status_code=400, detail="No packets to simulate. Add packets first.")

    mode = req.mode
    results: list[PacketSimulationResult] = []

    # Snapshot the graph so we can restore after dynamic mode
    edge_snapshot = store.snapshot_edges()

    for pkt_id, pkt_info in store.packets.items():
        source = pkt_info["source"]
        destination = pkt_info["destination"]

        # --- Dijkstra (traditional) ---
        if mode == "static":
            try:
                dijkstra_path = nx.dijkstra_path(store.graph, source, destination, weight="weight")
                dijkstra_cost = nx.dijkstra_path_length(store.graph, source, destination, weight="weight")
            except nx.NetworkXNoPath:
                dijkstra_path = []
                dijkstra_cost = -1
        # For dynamic mode, we run Dijkstra AFTER disruption (below)

        # --- ACO (swarm) ---
        disrupt_callback = None
        disrupt_at = None
        disruption_info = {}

        if mode == "dynamic":
            # Restore graph to pre-disruption state for each packet
            store.restore_from_snapshot(edge_snapshot)
            disrupt_callback, disruption_info = store.create_disruption_callback()
            disrupt_at = 15  # Disrupt at iteration 15

        aco = AntColonyOptimizer(
            graph=store.graph,
            num_ants=req.aco_params.num_ants,
            iterations=req.aco_params.iterations,
            evaporation_rate=req.aco_params.evaporation_rate,
        )

        aco_result = aco.run(
            source=source,
            destination=destination,
            disrupt_at_iteration=disrupt_at,
            disrupt_callback=disrupt_callback,
        )

        # In dynamic mode, run Dijkstra on the post-disruption graph
        if mode == "dynamic":
            try:
                dijkstra_path = nx.dijkstra_path(store.graph, source, destination, weight="weight")
                dijkstra_cost = nx.dijkstra_path_length(store.graph, source, destination, weight="weight")
            except nx.NetworkXNoPath:
                dijkstra_path = []
                dijkstra_cost = -1

        traditional = TraditionalResult(
            path=dijkstra_path,
            cost=round(dijkstra_cost, 2),
            hops=max(len(dijkstra_path) - 1, 0),
        )

        swarm = SwarmResult(
            path=aco_result["path"],
            cost=aco_result["cost"],
            hops=aco_result["hops"],
            converged_at_iteration=aco_result["converged_at_iteration"],
            overhead_packets_sent=aco_result["overhead_packets_sent"],
            convergence_history=[
                ConvergencePoint(**cp) for cp in aco_result["convergence_history"]
            ],
        )

        results.append(
            PacketSimulationResult(
                packet_id=pkt_id,
                traditional=traditional,
                swarm=swarm,
            )
        )

    # Restore graph after dynamic simulation
    if mode == "dynamic":
        store.restore_from_snapshot(edge_snapshot)

    return SimulateResponse(mode=mode, results=results)
