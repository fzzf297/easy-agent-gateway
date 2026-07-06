import { request } from "./request";

import type { ListResponse, Project, ProjectPayload, Status } from "@/types/admin";

export interface ListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export function listProjects(params: ListParams) {
  return request
    .get<ListResponse<Project>>("/api/admin/projects", { params })
    .then((response) => response.data);
}

export function createProject(payload: ProjectPayload) {
  return request.post<Project>("/api/admin/projects", payload).then((response) => response.data);
}

export function getProject(projectId: number) {
  return request.get<Project>(`/api/admin/projects/${projectId}`).then((response) => response.data);
}

export function updateProject(projectId: number, payload: Partial<ProjectPayload>) {
  return request
    .put<Project>(`/api/admin/projects/${projectId}`, payload)
    .then((response) => response.data);
}

export function deleteProject(projectId: number) {
  return request
    .delete<{ ok: boolean }>(`/api/admin/projects/${projectId}`)
    .then((response) => response.data);
}

export function patchProjectStatus(projectId: number, status: Status) {
  return updateProject(projectId, { status });
}
