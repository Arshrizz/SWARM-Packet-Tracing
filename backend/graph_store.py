"""
In-memory graph store and packet manager.
Wraps NetworkX for topology management and provides
dynamic disruption capabilities for congestion simulation.
"""

import random
import networkx as nx
from models import NodeModel, EdgeModel


class GraphStore:
    """Manages the network topology graph and active packets."""

    def __init__(self):
        self.graph = nx.Graph()
        self.packets: dict[str, dict] = {}  # id -> {source, destination}
        self._packet_counter = 0
        self._seed_default_topology()

    def _seed_default_topology(self):
        """Create a default 12-node network topology (A–L)."""
        nodes = [
            ("A", "Router A", 300, 10),
            ("B", "Router B", 110, 140),
            ("C", "Router C", 490, 140),
            ("D", "Router D", 20, 285),
            ("E", "Router E", 240, 285),
            ("F", "Router F", 470, 285),
            ("G", "Router G", 40, 430),
            ("H", "Router H", 250, 430),
            ("I", "Router I", 470, 430),
            ("J", "Router J", 120, 570),
            ("K", "Router K", 390, 570),
            ("L", "Router L", 255, 700),
        ]
        edges = [
            # Upper tier — A to B/C
            ("A", "B", 4),
            ("A", "C", 2),
            # Mid-upper — B/C to D/E/F
            ("B", "D", 5),
            ("B", "E", 10),
            ("C", "D", 8),
            ("C", "F", 3),
            # Mid — D/E/F cross-links
            ("D", "F", 6),
            ("D", "G", 2),
            ("E", "G", 7),
            ("E", "H", 3),
            ("F", "H", 9),
            ("G", "H", 4),
            # Lower tier — G/H/E/F to I/J
            ("E", "I", 6),
            ("F", "I", 5),
            ("G", "J", 4),
            ("H", "I", 2),
            ("H", "J", 8),
            # Bottom — I/J to K/L
            ("I", "K", 3),
            ("I", "L", 7),
            ("J", "K", 2),
            ("J", "L", 5),
            ("K", "L", 4),
        ]

        for node_id, label, x, y in nodes:
            self.graph.add_node(node_id, label=label, x=x, y=y)
        for u, v, w in edges:
            self.graph.add_edge(u, v, weight=w)

    def get_topology(self) -> dict:
        """Return current topology as nodes + edges."""
        nodes = [
            NodeModel(
                id=n,
                label=self.graph.nodes[n].get("label", n),
                x=self.graph.nodes[n].get("x"),
                y=self.graph.nodes[n].get("y"),
            )
            for n in self.graph.nodes()
        ]
        edges = [
            EdgeModel(
                source=u,
                target=v,
                weight=self.graph[u][v].get("weight", 1),
            )
            for u, v in self.graph.edges()
        ]
        return {"nodes": nodes, "edges": edges}

    def set_topology(self, nodes: list[NodeModel], edges: list[EdgeModel]):
        """Replace the entire topology."""
        self.graph.clear()
        for node in nodes:
            self.graph.add_node(node.id, label=node.label, x=node.x, y=node.y)
        for edge in edges:
            self.graph.add_edge(edge.source, edge.target, weight=edge.weight)

    def add_packet(self, source: str, destination: str) -> dict:
        """Add a packet to route. Returns the packet info."""
        self._packet_counter += 1
        pkt_id = f"pkt_{self._packet_counter}"
        self.packets[pkt_id] = {"source": source, "destination": destination}
        return {"id": pkt_id, "source": source, "destination": destination}

    def get_packets(self) -> list[dict]:
        """List all active packets."""
        return [
            {"id": pkt_id, "source": info["source"], "destination": info["destination"]}
            for pkt_id, info in self.packets.items()
        ]

    def delete_packet(self, packet_id: str) -> bool:
        """Remove a packet. Returns True if found and removed."""
        if packet_id in self.packets:
            del self.packets[packet_id]
            return True
        return False

    def create_disruption_callback(self) -> tuple[callable, dict]:
        """
        Create a callback that simulates network congestion/failure.
        Returns the callback and info about what will be disrupted.

        Strategy: spike 2-3 edge weights by 3x-5x, or drop 1 edge.
        """
        edges = list(self.graph.edges())
        if len(edges) < 3:
            return lambda: None, {"disruptions": []}

        disruption_info = {"disruptions": [], "iteration": 15}

        # Pick 2-3 edges to spike
        num_spikes = min(random.randint(2, 3), len(edges))
        spike_edges = random.sample(edges, num_spikes)

        # Possibly drop one edge instead of spiking it
        drop_edge = spike_edges[0] if random.random() < 0.3 else None

        original_weights = {}
        for u, v in spike_edges:
            original_weights[(u, v)] = self.graph[u][v]["weight"]

        def disrupt():
            for u, v in spike_edges:
                if drop_edge and (u, v) == drop_edge:
                    # Drop the edge entirely
                    if self.graph.has_edge(u, v):
                        self.graph.remove_edge(u, v)
                        disruption_info["disruptions"].append(
                            {"type": "dropped", "edge": [u, v]}
                        )
                else:
                    # Spike the weight
                    multiplier = random.uniform(3.0, 5.0)
                    old_weight = self.graph[u][v]["weight"]
                    new_weight = round(old_weight * multiplier, 1)
                    self.graph[u][v]["weight"] = new_weight
                    disruption_info["disruptions"].append(
                        {
                            "type": "spiked",
                            "edge": [u, v],
                            "old_weight": old_weight,
                            "new_weight": new_weight,
                        }
                    )

        return disrupt, disruption_info

    def restore_from_snapshot(self, snapshot_edges: list[tuple[str, str, float]]):
        """Restore graph edges from a snapshot (used after dynamic simulation)."""
        # Clear and rebuild edges only (nodes stay)
        current_nodes = list(self.graph.nodes(data=True))
        self.graph.clear()
        for node_id, attrs in current_nodes:
            self.graph.add_node(node_id, **attrs)
        for u, v, w in snapshot_edges:
            self.graph.add_edge(u, v, weight=w)

    def snapshot_edges(self) -> list[tuple[str, str, float]]:
        """Take a snapshot of current edges for later restoration."""
        return [
            (u, v, self.graph[u][v]["weight"])
            for u, v in self.graph.edges()
        ]
