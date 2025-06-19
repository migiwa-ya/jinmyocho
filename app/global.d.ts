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
    Variables: {
      title: string;
      "og:title": string;
      "og:site_name": string;
      "og:type": string;
      "og:url": string;
      "og:description": string;
      "og:image": string;
      "twitter:card": string;
      "twitter:image": string;
    };
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
