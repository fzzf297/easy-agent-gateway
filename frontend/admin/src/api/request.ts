import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import type { LoginResponse } from "@/types/admin";

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || "";
const ACCESS_TOKEN_KEY = "easy-agent-gateway.admin.access-token";
const REFRESH_TOKEN_KEY = "easy-agent-gateway.admin.refresh-token";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const authStorage = {
  getAccessToken() {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  },
  getRefreshToken() {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  },
  setTokens(accessToken: string, refreshToken: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

function isAdminApi(url?: string) {
  return Boolean(url?.startsWith("/api/admin/"));
}

function isAuthBootstrapApi(url?: string) {
  return url === "/api/admin/auth/login" || url === "/api/admin/auth/refresh";
}

request.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token && isAdminApi(config.url) && !isAuthBootstrapApi(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const refreshToken = authStorage.getRefreshToken();

    if (
      status === 401 &&
      config &&
      isAdminApi(config.url) &&
      !isAuthBootstrapApi(config.url) &&
      !config._retry &&
      refreshToken
    ) {
      config._retry = true;
      try {
        const response = await axios.post<LoginResponse>(
          "/api/admin/auth/refresh",
          { refreshToken },
          { baseURL: API_BASE_URL }
        );
        authStorage.setTokens(response.data.accessToken, response.data.refreshToken);
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return request(config);
      } catch (refreshError) {
        authStorage.clear();
        window.dispatchEvent(new CustomEvent("admin-auth-expired"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg || item).join("; ");
    return error.message;
  }
  return error instanceof Error ? error.message : "Unknown error";
}
