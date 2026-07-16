import { createRouter, createWebHistory } from "vue-router";

import { authStorage } from "@/api/request";
import AdminLayout from "@/layouts/AdminLayout.vue";
import { useAuthStore } from "@/stores/auth";
import AuditView from "@/views/AuditView.vue";
import DashboardView from "@/views/DashboardView.vue";
import LoginView from "@/views/LoginView.vue";
import InterfaceConfigView from "@/views/interfaces/InterfaceConfigView.vue";
import InterfaceListView from "@/views/interfaces/InterfaceListView.vue";
import PageListView from "@/views/pages/PageListView.vue";
import ProjectListView from "@/views/projects/ProjectListView.vue";

const router = createRouter({
  history: createWebHistory("/admin/"),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true }
    },
    {
      path: "/",
      component: AdminLayout,
      redirect: "/dashboard",
      children: [
        { path: "dashboard", name: "dashboard", component: DashboardView },
        { path: "projects", name: "projects", component: ProjectListView },
        { path: "audit", name: "audit", component: AuditView },
        {
          path: "projects/:projectId/pages",
          name: "project-pages",
          component: PageListView,
          props: true
        },
        {
          path: "projects/:projectId/interfaces",
          name: "project-interfaces",
          component: InterfaceListView,
          props: true
        },
        {
          path: "interfaces/:interfaceId/config",
          name: "interface-config",
          component: InterfaceConfigView,
          props: true
        }
      ]
    }
  ]
});

router.beforeEach(async (to) => {
  const isPublic = Boolean(to.meta.public);
  const token = authStorage.getAccessToken();

  if (!isPublic && !token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (isPublic && token && to.name === "login") {
    return { name: "dashboard" };
  }

  const auth = useAuthStore();
  if (!isPublic && token && !auth.user) {
    try {
      await auth.loadMe();
    } catch {
      authStorage.clear();
      return { name: "login", query: { redirect: to.fullPath } };
    }
  }
});

window.addEventListener("admin-auth-expired", () => {
  router.replace({ name: "login", query: { expired: "1" } });
});

export default router;
