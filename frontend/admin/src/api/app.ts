import { request } from "./request";

import type {
  AdminPage,
  ConfigVersion,
  InterfaceConfig,
  ListResponse,
  Project,
  PublicInterface
} from "@/types/admin";

export interface AppListParams {
  page?: number;
  pageSize?: number;
}

export function listAppProjects(params: AppListParams = {}) {
  return request
    .get<ListResponse<Project>>("/api/app/projects", { params })
    .then((response) => response.data);
}

export function getAppProject(projectCode: string) {
  return request
    .get<Project>(`/api/app/projects/${projectCode}`)
    .then((response) => response.data);
}

export function listAppPages(projectCode: string, params: AppListParams = {}) {
  return request
    .get<ListResponse<AdminPage>>(`/api/app/projects/${projectCode}/pages`, { params })
    .then((response) => response.data);
}

export function getAppPage(projectCode: string, pageCode: string) {
  return request
    .get<AdminPage>(`/api/app/projects/${projectCode}/pages/${pageCode}`)
    .then((response) => response.data);
}

export function listAppPageVersions(
  projectCode: string,
  pageCode: string,
  params: AppListParams = {}
) {
  return request
    .get<ListResponse<ConfigVersion>>(
      `/api/app/projects/${projectCode}/pages/${pageCode}/versions`,
      { params }
    )
    .then((response) => response.data);
}

export function listAppInterfaces(projectCode: string, params: AppListParams = {}) {
  return request
    .get<ListResponse<PublicInterface>>(`/api/app/projects/${projectCode}/interfaces`, { params })
    .then((response) => response.data);
}

export function getAppInterface(projectCode: string, interfaceCode: string) {
  return request
    .get<PublicInterface>(`/api/app/projects/${projectCode}/interfaces/${interfaceCode}`)
    .then((response) => response.data);
}

export function getAppInterfaceConfig(projectCode: string, interfaceCode: string) {
  return request
    .get<InterfaceConfig>(
      `/api/app/projects/${projectCode}/interfaces/${interfaceCode}/config`
    )
    .then((response) => response.data);
}

export function listAppInterfaceVersions(
  projectCode: string,
  interfaceCode: string,
  params: AppListParams = {}
) {
  return request
    .get<ListResponse<ConfigVersion>>(
      `/api/app/projects/${projectCode}/interfaces/${interfaceCode}/versions`,
      { params }
    )
    .then((response) => response.data);
}
