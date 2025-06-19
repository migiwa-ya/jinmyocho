import type {} from "hono";

type PublicEnv = {
  GITHUB_CLIENT_ID: string;
  GITHUB_REDIRECT_URI: string;
  IMAGE_REPOSITORY_NAME: string;
};

type PrivateEnv = {
  GITHUB_CLIENT_SECRET: string;
};

declare module "hono" {
  interface Env {
    Variables: {};
    Bindings: PublicEnv & PrivateEnv;
  }
}

declare global {
  interface Window {
    __ENV__: PublicEnv;
  }

  interface CacheStorage {
    default: Cache;
  }
}
