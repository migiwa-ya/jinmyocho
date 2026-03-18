import { defineStaticQL, StaticQL, StaticQLConfig, InMemoryCacheProvider } from "staticql";
import { FetchRepository } from "staticql/repo/fetch";
import { CachedRepository } from "staticql/repo/cached";

const url = "https://cdn.jinmyocho.com";

let staticql: StaticQL | null = null;

async function loadStaticQL() {
  if (staticql) return staticql;

  const configRaw = await fetch(`${url}/staticql.config.json`);
  const config = await configRaw.json();

  const factory = defineStaticQL(config as StaticQLConfig);
  staticql = factory({
    repository: new CachedRepository(
      new FetchRepository(url),
      new InMemoryCacheProvider()
    ),
  });

  return staticql;
}

export { loadStaticQL };
