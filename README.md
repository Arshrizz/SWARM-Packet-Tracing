# SWARM Packet Tracing Simulation

An interactive full-stack network simulation and visualization platform comparing **Swarm Intelligence (Ant Colony Optimization / ACO)** routing against **Traditional Routing (Dijkstra's Shortest Path)** under dynamic link conditions, latency, and congestion.

---

## Overview

Network routing in modern distributed systems requires adaptive, fault-tolerant decision-making. Traditional routing protocols (like OSPF/IS-IS based on Dijkstra's shortest path) calculate deterministic routes based purely on static edge costs. In contrast, **Swarm Intelligence Routing (ACO)** mimics biological ant colony foraging: packets deposit virtual pheromones on favorable paths, allowing the network to dynamically adapt to link delays, queue depths, and load fluctuations.

This platform provides:
- **Interactive Network Canvas**: Draggable, persistent node layouts powered by **React Flow**.
- **Dynamic Topology Editing**: Add/remove nodes, customize bidirectional edge weights/latencies in real time via custom modal dialogues.
- **Side-by-Side Simulation**: Compare routing paths, total end-to-end latency, hop counts, and pheromone concentration matrices.
- **Real-Time Analytics & Metrics**: Visual breakdown comparing execution efficiency, path divergence, and multi-metric trade-offs.

---

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript / React 19
- **Canvas & Graphing**: [@xyflow/react](https://reactflow.dev/) (React Flow)
- **Charts & Visualization**: [Recharts](https://recharts.org/)
- **Icons & Styling**: [Lucide React](https://lucide.dev/), Modern Tailwind CSS & CSS Variables (Cyber/Dark Theme)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **Graph Processing**: [NetworkX](https://networkx.org/)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/)
- **Routing Engine**: Custom Ant Colony Optimization (`aco.py`) with pheromone evaporation and heuristic visibility.

---

## Project Structure

```
swarm-packet-tracing/
├── backend/
│   ├── aco.py              # Ant Colony Optimization routing algorithm
│   ├── graph_store.py      # In-memory graph state & topology persistence
│   ├── main.py             # FastAPI endpoints & CORS configuration
│   ├── models.py           # Pydantic schemas for nodes, edges, & simulation
│   └── requirements.txt    # Python package dependencies
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── CustomNode.tsx     # Custom styled React Flow node component
│   │   │   ├── EdgeModal.tsx      # Modal for configuring node connections & weights
│   │   │   ├── MetricsPanel.tsx   # Latency, hop count & comparison cards
│   │   │   └── TopologyCanvas.tsx # Interactive canvas with draggable nodes
│   │   ├── lib/
│   │   │   ├── api.ts             # Backend API client
│   │   │   └── types.ts           # Shared TypeScript interfaces
│   │   ├── globals.css            # Cyber dark theme design system
│   │   ├── layout.tsx             # Root layout & fonts
│   │   └── page.tsx               # Main dashboard & simulation controls
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** 18+ and **npm** / **pnpm**
- **Python** 3.10+

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
# On Windows:
python -m venv venv
.\venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend server will run at: `http://localhost:8000`  
Interactive Swagger API docs available at: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/topology` | Retrieve current nodes (with coordinates) and weighted edges |
| `POST` | `/topology/node` | Add a new node (auto-generated ID and position) |
| `PUT` | `/topology/node/{node_id}` | Update node coordinates (persisted on drag) |
| `POST` | `/topology/edge` | Add or update an edge weight between two nodes |
| `DELETE` | `/topology/edge` | Remove an edge between source and target |
| `POST` | `/simulate` | Run comparison simulation (Source, Destination, Ants, Iterations) |

---

## Algorithmic Comparison

### 1. Traditional Routing (Dijkstra's Algorithm)
- Finds the strictly optimal deterministic path based on static link weights:
  $$\min \sum_{e \in P} w(e)$$
- Fails to dynamically balance load or adapt when intermediary links experience sudden congestion.

### 2. Swarm Intelligence (Ant Colony Optimization)
- Uses probabilistic state transitions governed by pheromone concentration ($\tau$) and heuristic visibility ($\eta = \frac{1}{\text{weight}}$):
  $$P_{ij}^k = \frac{[\tau_{ij}]^\alpha \cdot [\eta_{ij}]^\beta}{\sum_{l \in \text{allowed}} [\tau_{il}]^\alpha \cdot [\eta_{il}]^\beta}$$
- Pheromone evaporation prevents convergence on local sub-optimal traps:
  $$\tau_{ij} \leftarrow (1 - \rho)\tau_{ij} + \sum \Delta \tau_{ij}$$
- Capable of discovering multiple resilient routes and adapting dynamically.