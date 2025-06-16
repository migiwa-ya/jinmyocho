import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import { getUsername } from "../../../utils/github";

export type NameResult = { error: string } | { ok: boolean; userName: string };

export default createRoute(async (c) => {
  try {
    const token = getCookie(c, "gh_token");
    if (!token) {
      const res: NameResult = { error: "Unauthorized" };
      return c.json(res, 401);
    }
    const userName = await getUsername(token);
    const res: NameResult = { ok: true, userName };
    return c.json(res);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const res: NameResult = { error: msg };
    return c.json(res, 500);
  }
});
