import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import {
  getUsername,
  checkRepositoryExists,
  createRepository,
  listImageResources,
  type ImageResource,
} from "../../../utils/github";

export type ListResult =
  | { error: string }
  | { ok: boolean; images: ImageResource[] };

export default createRoute(async (c) => {
  const token = getCookie(c, "gh_token");
  if (!token) {
    const res: ListResult = { error: "Unauthorized" };
    return c.json(res, 401);
  }

  const username = await getUsername(token);
  const repoName = c.env.IMAGE_REPOSITORY_NAME;

  if (!(await checkRepositoryExists(token, repoName))) {
    await createRepository(token, repoName);
    await new Promise((r) => setTimeout(r, 2000));
  }

  const images = await listImageResources(
    token,
    username,
    c.env.IMAGE_REPOSITORY_NAME
  );

  const res: ListResult = { ok: true, images };
  return c.json(res);
});
