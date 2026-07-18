/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
  readonly VITE_REPO_BASE_URL?: string;
  readonly VITE_WIKI_BASE_URL?: string;
  readonly VITE_DISCORD_APPLICATION_ID?: string;
  readonly VITE_PAZAAK_DISCORD_APPLICATION_ID?: string;
  readonly VITE_API_BASES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
