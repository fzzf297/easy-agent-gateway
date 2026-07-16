import { request } from "./request";

import type {
  AppInterface,
  ConfigVersion,
  InterfaceConfig,
  InterfacePayload,
  InterfaceTestPayload,
  InterfaceTestResult,
  ListResponse,
  Status,
  YamlValidationResult
} from "@/types/admin";
import type { ListParams } from "./projects";

export function listInterfaces(projectId: number, params: ListParams) {
  return request
    .get<ListResponse<AppInterface>>(`/api/admin/projects/${projectId}/interfaces`, { params })
    .then((response) => response.data);
}

export function createInterface(projectId: number, payload: InterfacePayload) {
  return request
    .post<AppInterface>(`/api/admin/projects/${projectId}/interfaces`, payload)
    .then((response) => response.data);
}

export function getInterface(interfaceId: number) {
  return request
    .get<AppInterface>(`/api/admin/interfaces/${interfaceId}`)
    .then((response) => response.data);
}

export function updateInterface(interfaceId: number, payload: Partial<InterfacePayload>) {
  return request
    .put<AppInterface>(`/api/admin/interfaces/${interfaceId}`, payload)
    .then((response) => response.data);
}

export function updateInterfaceStatus(interfaceId: number, status: Status) {
  return request
    .patch<AppInterface>(`/api/admin/interfaces/${interfaceId}/status`, { status })
    .then((response) => response.data);
}

export function deleteInterface(interfaceId: number) {
  return request
    .delete<{ ok: boolean }>(`/api/admin/interfaces/${interfaceId}`)
    .then((response) => response.data);
}

export function getInterfaceConfig(interfaceId: number) {
  return request
    .get<InterfaceConfig>(`/api/admin/interfaces/${interfaceId}/config`)
    .then((response) => response.data);
}

export function saveInterfaceYaml(interfaceId: number, yamlText: string) {
  return request
    .put<InterfaceConfig>(`/api/admin/interfaces/${interfaceId}/config-yaml`, { yamlText })
    .then((response) => response.data);
}

export function validateInterfaceYaml(yamlText: string) {
  return request
    .post<YamlValidationResult>("/api/admin/interfaces/config-yaml/validate", { yamlText })
    .then((response) => response.data);
}

export function listInterfaceVersions(interfaceId: number, params: ListParams) {
  return request
    .get<ListResponse<ConfigVersion>>(`/api/admin/interfaces/${interfaceId}/versions`, { params })
    .then((response) => response.data);
}

export function getInterfaceVersion(interfaceId: number, version: number) {
  return request
    .get<ConfigVersion>(`/api/admin/interfaces/${interfaceId}/versions/${version}`)
    .then((response) => response.data);
}

export function testInterface(payload: InterfaceTestPayload) {
  return request
    .post<InterfaceTestResult>("/api/agent/interfaces/test", payload)
    .then((response) => response.data);
}
