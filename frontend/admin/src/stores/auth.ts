import { defineStore } from "pinia";

import { getMe, login as loginRequest, logout as logoutRequest } from "@/api/auth";
import { authStorage } from "@/api/request";
import type { AdminUser } from "@/types/admin";

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    loading: false
  }),
  getters: {
    isAuthenticated: () => Boolean(authStorage.getAccessToken())
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true;
      try {
        const response = await loginRequest(username, password);
        authStorage.setTokens(response.accessToken, response.refreshToken);
        this.user = response.user;
      } finally {
        this.loading = false;
      }
    },
    async loadMe() {
      if (!authStorage.getAccessToken()) return;
      this.user = await getMe();
    },
    async logout() {
      const refreshToken = authStorage.getRefreshToken();
      try {
        if (authStorage.getAccessToken()) {
          await logoutRequest(refreshToken);
        }
      } finally {
        authStorage.clear();
        this.user = null;
      }
    }
  }
});
