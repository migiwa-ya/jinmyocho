import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import {
  getUsername,
  fetchMetaJson,
  updateMetaJson,
} from "../../../utils/github";

export type MetaUpdateResult = { error: string } | { ok: boolean };

export const PATCH = createRoute(async (c) => {
  const token = getCookie(c, "gh_token");
  if (!token) {
    const result: MetaUpdateResult = { error: "Unauthorized" };
    return c.json(result, 401);
  }

  const body = await c.req.json<{
    metaFilename?: string;
    shrineSlug?: string | null;
  }>();

  const { metaFilename, shrineSlug } = body;

  if (typeof metaFilename !== "string" || !metaFilename.trim()) {
    const result: MetaUpdateResult = { error: "metaFilename is required" };
    return c.json(result, 400);
  }

  try {
    const username = await getUsername(token);
    const repoName = c.env.IMAGE_REPOSITORY_NAME;

    // 現在のメタデータを取得
    const { content, sha } = await fetchMetaJson(
      token,
      username,
      repoName,
      metaFilename
    );

    // shrineSlug を更新（null なら削除）
    if (shrineSlug === null || shrineSlug === "") {
      delete content.shrineSlug;
    } else if (typeof shrineSlug === "string") {
      content.shrineSlug = shrineSlug;
    }

    // 書き戻し
    await updateMetaJson(
      token,
      username,
      repoName,
      metaFilename,
      content,
      sha
    );

    const result: MetaUpdateResult = { ok: true };
    return c.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const result: MetaUpdateResult = { error: msg };
    return c.json(result, 500);
  }
});
