/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JAZZ_WORKER_ACCOUNT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
