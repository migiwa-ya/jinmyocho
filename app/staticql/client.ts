import { defineStaticQL, StaticQL, StaticQLConfig } from "staticql";
import { FetchRepository } from "staticql/repo/fetch";
import { CachedRepository } from "staticql/repo/cached";

const url = "https://cdn.jinmyocho.com";

let staticql: StaticQL | null = null;

// Simple in-memory cache for Workers environment (no IndexedDB)
const memoryCache = {
  store: new Map<string, any>(),
  async get<T = unknown>(key: string) { return this.store.get(key) as T | undefined; },
  async set<T = unknown>(key: string, value: T) { this.store.set(key, value); },
  async has(key: string) { return this.store.has(key); },
  async delete(key: string) { this.store.delete(key); },
  async clear() { this.store.clear(); },
};

async function loadStaticQL() {
  if (staticql) return staticql;

  const configRaw = await fetch(`${url}/staticql.config.json`);
  const config = await configRaw.json();

  const factory = defineStaticQL(config as StaticQLConfig);
  staticql = factory({
    repository: new CachedRepository(
      new FetchRepository(url),
      memoryCache
    ),
  });

  return staticql;
}

export { loadStaticQL };
