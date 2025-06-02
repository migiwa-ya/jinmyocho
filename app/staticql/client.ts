import { defineStaticQL, StaticQL, StaticQLConfig } from "staticql";
import { FetchRepository } from "staticql/repo/fetch";

const url = "https://cdn.jinmyocho.com";

let staticql: StaticQL | null = null;

async function loadStaticQL() {
  if (staticql) return staticql; // 既に初期化済みなら再利用

  const configRaw = await fetch(`${url}/staticql.config.json`);
  const config = await configRaw.json();

  const factory = defineStaticQL(config as StaticQLConfig);
  staticql = factory({ repository: new FetchRepository(url) });

  return staticql;
}

export { loadStaticQL };
