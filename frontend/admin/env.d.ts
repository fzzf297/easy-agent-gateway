/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_API_BASE_URL?: string;
  readonly VITE_ADMIN_PROXY_TARGET?: string;
  readonly VITE_AGENT_PROXY_TARGET?: string;
  readonly VITE_ADMIN_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "vue" {
  export interface GlobalComponents {
    [key: string]: any;
  }

  export interface GlobalDirectives {
    [key: string]: any;
  }
}

export {};
