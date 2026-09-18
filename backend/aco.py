"""
Ant Colony Optimization (ACO) for network packet routing.
Built from scratch — no external ACO libraries.
"""

import random
import math
from typing import Optional
import networkx as nx


class AntColonyOptimizer:
    """
    ACO implementation for finding shortest paths in a weighted graph.

    Each ant probabilistically explores the graph, biased by:
      - Pheromone intensity on edges (exploitation)
      - Inverse edge cost / heuristic desirability (exploration)

    After all ants complete a tour, pheromone is deposited on edges
    proportional to path quality (1 / path_cost), then evaporated.
    """

    def __init__(
        self,
        graph: nx.Graph,
        num_ants: int = 20,
        iterations: int = 50,
        evaporation_rate: float = 0.1,
        alpha: float = 1.0,      # pheromone influence
        beta: float = 2.0,       # heuristic (1/cost) influence
        q: float = 100.0,        # pheromone deposit factor
        convergence_k: int = 5,  # stop if best unchanged for K iterations
    ):
        self.graph = graph
        self.num_ants = num_ants
        self.iterations = iterations
        self.evaporation_rate = evaporation_rate
        self.alpha = alpha
        self.beta = beta
        self.q = q
        self.convergence_k = convergence_k

        # Initialize pheromone on all edges
        self.pheromone: dict[tuple[str, str], float] = {}
        initial_pheromone = 1.0
        for u, v in self.graph.edges():
            self.pheromone[(u, v)] = initial_pheromone
            self.pheromone[(v, u)] = initial_pheromone

    def _get_pheromone(self, u: str, v: str) -> float:
        return self.pheromone.get((u, v), 0.001)

    def _get_heuristic(self, u: str, v: str) -> float:
        """Heuristic desirability = 1 / edge weight (cost)."""
        weight = self.graph[u][v].get("weight", 1)
        return 1.0 / max(weight, 0.001)

    def _select_next_node(self, current: str, visited: set[str], destination: str) -> Optional[str]:
        """
        Probabilistically select the next node for an ant to visit.
        Considers only unvisited neighbors.
        """
        neighbors = [
            n for n in self.graph.neighbors(current) if n not in visited
        ]

        if not neighbors:
            return None

        # If destination is a direct neighbor and unvisited, bias heavily
        if destination in neighbors:
            # Still use probabilistic selection, but destination is among candidates
            pass

        # Calculate selection probabilities
        probabilities = []
        for neighbor in neighbors:
            tau = self._get_pheromone(current, neighbor)
            eta = self._get_heuristic(current, neighbor)
            prob = (tau ** self.alpha) * (eta ** self.beta)
            probabilities.append(prob)

        total = sum(probabilities)
        if total == 0:
            return random.choice(neighbors)

        # Roulette wheel selection
        probabilities = [p / total for p in probabilities]
        r = random.random()
        cumulative = 0.0
        for i, prob in enumerate(probabilities):
            cumulative += prob
            if r <= cumulative:
                return neighbors[i]

        return neighbors[-1]  # Fallback

    def _construct_path(self, source: str, destination: str) -> Optional[tuple[list[str], float]]:
        """
        Single ant constructs a path from source to destination.
        Returns (path, cost) or None if no path found.
        """
        path = [source]
        visited = {source}
        current = source
        cost = 0.0

        while current != destination:
            next_node = self._select_next_node(current, visited, destination)
            if next_node is None:
                return None  # Ant got stuck

            edge_weight = self.graph[current][next_node].get("weight", 1)
            cost += edge_weight
            path.append(next_node)
            visited.add(next_node)
            current = next_node

        return path, cost

    def _deposit_pheromone(self, all_paths: list[tuple[list[str], float]]):
        """Deposit pheromone on edges used by ants, proportional to path quality."""
        for path, cost in all_paths:
            if cost <= 0:
                continue
            deposit = self.q / cost
            for i in range(len(path) - 1):
                u, v = path[i], path[i + 1]
                self.pheromone[(u, v)] = self.pheromone.get((u, v), 0) + deposit
                self.pheromone[(v, u)] = self.pheromone.get((v, u), 0) + deposit

    def _evaporate_pheromone(self):
        """Evaporate pheromone from all edges."""
        for edge in self.pheromone:
            self.pheromone[edge] *= (1 - self.evaporation_rate)
            # Keep a minimum pheromone level to avoid dead edges
            self.pheromone[edge] = max(self.pheromone[edge], 0.001)

    def run(
        self,
        source: str,
        destination: str,
        disrupt_at_iteration: Optional[int] = None,
        disrupt_callback: Optional[callable] = None,
    ) -> dict:
        """
        Run the ACO simulation.

        Args:
            source: Start node
            destination: End node
            disrupt_at_iteration: If set, call disrupt_callback at this iteration
            disrupt_callback: Function to modify the graph (for dynamic mode)

        Returns:
            dict with keys: path, cost, converged_at_iteration,
                            overhead_packets_sent, convergence_history
        """
        best_path: Optional[list[str]] = None
        best_cost = float("inf")
        convergence_history: list[dict] = []
        total_overhead = 0
        converged_at = self.iterations
        stable_count = 0
        prev_best_cost = float("inf")

        for iteration in range(1, self.iterations + 1):
            # Dynamic disruption
            if disrupt_at_iteration and iteration == disrupt_at_iteration and disrupt_callback:
                disrupt_callback()
                # Reset pheromone partially after disruption to allow re-exploration
                for edge in self.pheromone:
                    self.pheromone[edge] *= 0.5

            # Each ant constructs a path
            iteration_paths: list[tuple[list[str], float]] = []
            for _ in range(self.num_ants):
                result = self._construct_path(source, destination)
                total_overhead += 1  # Each ant = 1 overhead packet
                if result is not None:
                    iteration_paths.append(result)

            # Update best path from this iteration
            for path, cost in iteration_paths:
                if cost < best_cost:
                    best_path = path
                    best_cost = cost

            # Record convergence history
            convergence_history.append({
                "iteration": iteration,
                "best_cost": round(best_cost, 2) if best_cost != float("inf") else None,
            })

            # Pheromone update
            self._evaporate_pheromone()
            if iteration_paths:
                self._deposit_pheromone(iteration_paths)

            # Convergence check
            if best_cost == prev_best_cost:
                stable_count += 1
            else:
                stable_count = 0
                prev_best_cost = best_cost

            if stable_count >= self.convergence_k and converged_at == self.iterations:
                converged_at = iteration - self.convergence_k

        return {
            "path": best_path if best_path else [],
            "cost": round(best_cost, 2) if best_cost != float("inf") else None,
            "hops": len(best_path) - 1 if best_path else 0,
            "converged_at_iteration": converged_at,
            "overhead_packets_sent": total_overhead,
            "convergence_history": convergence_history,
        }
