import { request } from "./request";

import type { AdminHealth, AgentHealth } from "@/types/admin";

export function getAdminHealth() {
  return request.get<AdminHealth>("/health").then((response) => response.data);
}

export function getAgentHealth() {
  return request.get<AgentHealth>("/agent/health").then((response) => response.data);
}
