import { request } from "./request";

import type { AgentAuditQuery, AgentAuditResponse } from "@/types/admin";

export function getAgentAudit(params: AgentAuditQuery) {
  return request
    .get<AgentAuditResponse>("/api/agent/audit", { params })
    .then((response) => response.data);
}
