import { request } from "./request";

import type { AdminPage, ConfigVersion, ListResponse, PagePayload, Status } from "@/types/admin";
import type { ListParams } from "./projects";

export function listPages(projectId: number, params: ListParams) {
  return request
    .get<ListResponse<AdminPage>>(`/api/admin/projects/${projectId}/pages`, { params })
    .then((response) => response.data);
}

export function createPage(projectId: number, payload: PagePayload) {
  return request
    .post<AdminPage>(`/api/admin/projects/${projectId}/pages`, payload)
    .then((response) => response.data);
}

export function getPage(pageId: number) {
  return request.get<AdminPage>(`/api/admin/pages/${pageId}`).then((response) => response.data);
}

export function updatePage(pageId: number, payload: Partial<PagePayload>) {
  return request.put<AdminPage>(`/api/admin/pages/${pageId}`, payload).then((response) => response.data);
}

export function updatePageStatus(pageId: number, status: Status) {
  return request
    .patch<AdminPage>(`/api/admin/pages/${pageId}/status`, { status })
    .then((response) => response.data);
}

export function deletePage(pageId: number) {
  return request.delete<{ ok: boolean }>(`/api/admin/pages/${pageId}`).then((response) => response.data);
}

export function listPageVersions(pageId: number, params: ListParams) {
  return request
    .get<ListResponse<ConfigVersion>>(`/api/admin/pages/${pageId}/versions`, { params })
    .then((response) => response.data);
}

export function getPageVersion(pageId: number, version: number) {
  return request
    .get<ConfigVersion>(`/api/admin/pages/${pageId}/versions/${version}`)
    .then((response) => response.data);
}
