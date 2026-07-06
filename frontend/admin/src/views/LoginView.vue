<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-panel__intro">
        <div class="login-panel__eyebrow">Easy Agent Gateway</div>
        <h2>欢迎回来</h2>
        <p>维护项目、页面配置与 Agent 可调用接口。</p>
      </div>

      <a-alert
        v-if="route.query.expired"
        type="warning"
        show-icon
        message="登录已过期，请重新登录"
      />

      <a-form class="login-form" layout="vertical" :model="form" @finish="handleSubmit">
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model:value="form.username" autocomplete="username" size="large">
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码' }]"
        >
          <a-input-password v-model:value="form.password" autocomplete="current-password" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-button type="primary" html-type="submit" size="large" block :loading="auth.loading">
          登录控制台
        </a-button>
      </a-form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { LockOutlined, UserOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { reactive } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getErrorMessage } from "@/api/request";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  username: "admin",
  password: ""
});

async function handleSubmit() {
  try {
    await auth.login(form.username, form.password);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
    router.replace(redirect);
  } catch (error) {
    message.error(getErrorMessage(error));
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%),
    #f4f7fb;
}

.login-panel {
  width: min(420px, 100%);
  display: grid;
  gap: 22px;
  padding: 30px;
  background: #fff;
  border: 1px solid #e6edf7;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgb(23 32 51 / 12%);
}

.login-panel__intro {
  display: grid;
  gap: 8px;
}

.login-panel__intro h2,
.login-panel__intro p {
  margin: 0;
}

.login-panel__intro h2 {
  color: #172033;
  font-size: 28px;
  line-height: 1.25;
}

.login-panel__intro p {
  color: #667085;
}

.login-panel__eyebrow {
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-form {
  display: grid;
}

@media (max-width: 900px) {
  .login-page {
    padding: 20px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 14px;
  }

  .login-panel {
    padding: 22px;
  }
}
</style>
