import { request } from "./request";

import type { AdminUser, LoginResponse } from "@/types/admin";

export function login(username: string, password: string) {
  return request
    .post<LoginResponse>("/api/admin/auth/login", { username, password })
    .then((response) => response.data);
}

export function refresh(refreshToken: string) {
  return request
    .post<LoginResponse>("/api/admin/auth/refresh", { refreshToken })
    .then((response) => response.data);
}

export function logout(refreshToken?: string) {
  return request
    .post<{ ok: boolean }>("/api/admin/auth/logout", { refreshToken })
    .then((response) => response.data);
}

export function getMe() {
  return request.get<AdminUser>("/api/admin/auth/me").then((response) => response.data);
}
