import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import {
  getUsername,
  checkRepositoryExists,
  createRepository,
  uploadImageToRepo,
  enableGitHubPages,
} from "../../../utils/github";
import { randomFilename } from "../../../utils/file";

export type UploadResult =
  | { error: string }
  | { ok: boolean; filename: string };

export default createRoute(async (c) => {
  const token = getCookie(c, "gh_token");
  if (!token) {
    const result: UploadResult = { error: "Unauthorized" };
    return c.json(result, 401);
  }

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    const result: UploadResult = { error: "No file provided" };
    return c.json(result, 400);
  }
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  uint8.forEach((b) => (binary += String.fromCharCode(b)));
  const base64Content = btoa(binary);

  const username = await getUsername(token);
  const repoName = c.env.IMAGE_REPOSITORY_NAME;

  if (!(await checkRepositoryExists(token, repoName))) {
    await createRepository(token, repoName);
    await new Promise((r) => setTimeout(r, 2000));
  }

  const safeFilename = randomFilename({ ext: "jpg" });
  await uploadImageToRepo(
    token,
    username,
    repoName,
    safeFilename,
    base64Content
  );

  await enableGitHubPages(token, username, repoName);

  const result: UploadResult = { ok: true, filename: safeFilename };
  return c.json(result);
});
