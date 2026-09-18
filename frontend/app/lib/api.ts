/* API client for backend communication */

import type {
  Topology,
  Packet,
  ACOParams,
  SimulateResponse,
} from "./types";

const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

export async function getTopology(): Promise<Topology> {
  return request<Topology>("/topology");
}

export async function setTopology(topology: Topology): Promise<Topology> {
  return request<Topology>("/topology", {
    method: "POST",
    body: JSON.stringify(topology),
  });
}

export async function addPacket(
  source: string,
  destination: string
): Promise<Packet> {
  return request<Packet>("/packets", {
    method: "POST",
    body: JSON.stringify({ source, destination }),
  });
}

export async function getPackets(): Promise<Packet[]> {
  return request<Packet[]>("/packets");
}

export async function deletePacket(packetId: string): Promise<void> {
  return request<void>(`/packets/${packetId}`, {
    method: "DELETE",
  });
}

export async function runSimulation(
  mode: "static" | "dynamic",
  acoParams: ACOParams
): Promise<SimulateResponse> {
  return request<SimulateResponse>("/simulate", {
    method: "POST",
    body: JSON.stringify({
      mode,
      aco_params: acoParams,
    }),
  });
}
