import { createRoute } from "honox/factory";
import { getCookie } from "hono/cookie";
import {
  getUsername,
  checkRepositoryExists,
  createRepository,
  uploadFileToRepo,
} from "../../../utils/github";
import { randomFilename, utf8ToBase64 } from "../../../utils/file";

export type UploadResult =
  | { error: string }
  | { ok: boolean; filename: string };

export const POST = createRoute(async (c) => {
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

  // 画像バイナリを Base64 にエンコード
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  uint8.forEach((b) => (binary += String.fromCharCode(b)));
  const base64Content = btoa(binary);

  // GitHub ユーザー名取得
  const username = await getUsername(token);
  const repoName = c.env.IMAGE_REPOSITORY_NAME;

  // リポジトリが無ければ作成（存在チェックのあとに create）
  if (!(await checkRepositoryExists(token, repoName))) {
    await createRepository(token, repoName);
    // リポジトリ作成直後は GitHub 側の準備に時間がかかる場合があるので適宜待機
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 画像ファイル名をランダム生成
  const safeFilename = randomFilename({ ext: "jpg" });
  // 例: "abcd1234.jpg"
  // 画像アップロード
  await uploadFileToRepo(
    token,
    username,
    repoName,
    safeFilename,
    base64Content
  );

  // --- メタデータ JSON 保存 ---
  // フォームから description, license を取得
  const licenseField = form.get("license");
  const descriptionField = form.get("description");
  // license は必須と想定。ない場合はエラー返すかデフォルト扱いにするか検討
  if (typeof licenseField !== "string" || !licenseField) {
    const result: UploadResult = { error: "No license provided" };
    return c.json(result, 400);
  }
  const ccLicense = licenseField;
  // description は任意
  const description =
    typeof descriptionField === "string" && descriptionField.trim() !== ""
      ? descriptionField.trim()
      : undefined;

  // userName: ここでは GitHub ユーザー名を利用
  const userName = username;

  // JSON オブジェクトを文字列化
  const metaObj: {
    userName: string;
    ccLicense: string;
    description?: string;
  } = { userName, ccLicense };
  if (description !== undefined) {
    metaObj.description = description;
  }
  const jsonString = JSON.stringify(metaObj, null, 2);

  const base64Meta = utf8ToBase64(jsonString);

  // JSON ファイル名を画像と同じ basename + .json
  const idx = safeFilename.lastIndexOf(".");
  const basename = idx >= 0 ? safeFilename.substring(0, idx) : safeFilename;
  const metaFilename = `${basename}.json`; // 例: "abcd1234.json"

  // メタデータアップロード
  await uploadFileToRepo(token, username, repoName, metaFilename, base64Meta);
  // --------------------------------

  // レスポンス
  const result: UploadResult = { ok: true, filename: safeFilename };
  return c.json(result);
});
