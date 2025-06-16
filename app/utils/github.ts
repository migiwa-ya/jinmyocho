import { ShrinesRecord } from "../staticql/staticql-types";
import { stripFrontmatter } from "./parse";

export type GitHubUser = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  [key: string]: unknown;
};

export const createRepository = async (
  token: string,
  repoName: string,
  initialBranch: string = "gh-pages"
) => {
  // ① リポジトリ作成（auto_init: true で最初のコミットを作成）
  const createRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "jinmyocho.com",
    },
    body: JSON.stringify({
      name: repoName,
      description: "神名帳 https://jinmyocho.com/ 投稿用データ",
      private: false,
      auto_init: true,
      // ※ GitHub API では create-repo 時に default_branch 指定はサポートされていないため、
      //    後続でブランチ作成＆デフォルト切り替えを行う
    }),
  });

  if (!createRes.ok) {
    const error = await createRes.json().catch(() => ({}));
    throw new Error(`リポジトリ作成に失敗しました: ${JSON.stringify(error)}`);
  }

  // repo.default_branch には GitHub 側のデフォルトブランチ名（例: "main"）が入っている
  const repo: { default_branch: string } = await createRes.json();
  const defaultBranch: string = repo.default_branch;

  // ② ユーザー名を取得
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "jinmyocho.com",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!userRes.ok) {
    const err = await userRes.json().catch(() => ({}));
    throw new Error(`ユーザー情報取得に失敗しました: ${JSON.stringify(err)}`);
  }

  const user: GitHubUser = await userRes.json();
  const username = user.login;

  // ③ デフォルトブランチのコミット SHA を取得
  // GET /repos/:owner/:repo/git/ref/heads/:branch
  const refRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${encodeURIComponent(
      defaultBranch
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "jinmyocho.com",
      },
    }
  );
  if (!refRes.ok) {
    const err = await refRes.json().catch(() => ({}));
    throw new Error(
      `デフォルトブランチのリファレンス取得に失敗しました: ${JSON.stringify(
        err
      )}`
    );
  }

  const refData: { object: any } = await refRes.json();
  const defaultSha: string = refData.object?.sha;
  if (!defaultSha) {
    throw new Error("デフォルトブランチのコミット SHA を取得できませんでした");
  }

  // ④ initialBranch が defaultBranch と異なる場合、新規ブランチを作成し、デフォルトブランチを切り替え
  if (initialBranch !== defaultBranch) {
    // 4-1. 既に同名ブランチが存在していないか確認
    const checkBranchRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/git/ref/heads/${encodeURIComponent(
        initialBranch
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "jinmyocho.com",
        },
      }
    );
    if (checkBranchRes.status === 404) {
      // ブランチが存在しないなら作成
      const createRefRes = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "jinmyocho.com",
          },
          body: JSON.stringify({
            ref: `refs/heads/${initialBranch}`,
            sha: defaultSha,
          }),
        }
      );
      if (!createRefRes.ok) {
        const err = await createRefRes.json().catch(() => ({}));
        throw new Error(
          `initialBranch 用ブランチ作成に失敗しました: ${JSON.stringify(err)}`
        );
      }
    } else if (!checkBranchRes.ok) {
      // 404 以外のエラー
      const err = await checkBranchRes.json().catch(() => ({}));
      throw new Error(`ブランチ存在確認に失敗しました: ${JSON.stringify(err)}`);
    }
    // 4-2. リポジトリのデフォルトブランチを initialBranch に切り替え
    const updateRepoRes = await fetch(
      `https://api.github.com/repos/${username}/${repoName}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "jinmyocho.com",
        },
        body: JSON.stringify({
          default_branch: initialBranch,
        }),
      }
    );
    if (!updateRepoRes.ok) {
      const err = await updateRepoRes.json().catch(() => ({}));
      throw new Error(
        `デフォルトブランチの切り替えに失敗しました: ${JSON.stringify(err)}`
      );
    }
  }

  // ⑤ .nojekyll ファイルを追加（branch: initialBranch）
  const putRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/contents/.nojekyll`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "jinmyocho.com",
      },
      body: JSON.stringify({
        message: "Add .nojekyll to disable Jekyll processing",
        content: "", // 空文字を base64 エンコード (GitHub API 側で空文字の base64 も許容される)
        branch: initialBranch,
      }),
    }
  );
  if (!putRes.ok) {
    const error = await putRes.json().catch(() => ({}));
    throw new Error(`.nojekyll 作成に失敗しました: ${JSON.stringify(error)}`);
  }

  // 最終的に作成されたリポジトリ情報を返す
  return repo;
};

export const checkRepositoryExists = async (
  token: string,
  repoName: string
) => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${await getUsername(token)}/${repoName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "jinmyocho.com",
        },
      }
    );
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const getUsername = async (token: string) => {
  console.log(
    "[getUsername] token prefix:",
    token.slice(0, 8),
    "...suffix:",
    token.slice(-8)
  );
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "jinmyocho.com",
    },
  });
  console.log("[getUsername] response.status:", response.status);
  const text = await response.text();
  console.log("[getUsername] raw body:", text);
  let user: GitHubUser;
  try {
    user = JSON.parse(text);
  } catch (err) {
    console.error("[getUsername] JSON parse error:", err);
    throw new Error(`GitHubユーザー情報の取得に失敗しました (invalid JSON)`);
  }
  if (!response.ok) {
    const msg = (user as any)?.message || `status=${response.status}`;
    throw new Error(`GitHubユーザー情報の取得に失敗しました: ${msg}`);
  }
  console.log("[getUsername] login:", user.login);
  return user.login;
};

export interface UploadResult {
  contentResponse: any; // GitHub API のレスポンス JSON
  rawUrl?: string; // raw.githubusercontent.com 経由の URL（branch, path が分かる場合のみ）
}

/**
 * 画像ファイルを GitHub リポジトリ内の images/ ディレクトリにアップロード（または更新）する。
 *
 * @param token GitHub Personal Access Token
 * @param username リポジトリ所有者ユーザー名
 * @param repoName リポジトリ名
 * @param filename 画像ファイル名（例: "example.png"）
 * @param base64Content 画像を Base64 エンコードした文字列（padding '=' も含む）
 * @param branch オプション: ブランチ名。デフォルトは "gh-pages"。
 * @returns アップロード結果オブジェクト（API レスポンス JSON と raw URL を含む可能性あり）
 *
 * @throws Error GET/PUT が失敗した場合に例外を投げる
 */
export const uploadFileToRepo = async (
  token: string,
  username: string,
  repoName: string,
  filename: string,
  base64Content: string,
  branch: string = "gh-pages"
): Promise<UploadResult> => {
  const path = `images/${filename}`;
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(
    username
  )}/${encodeURIComponent(repoName)}/contents/${encodeURIComponent(path)}`;

  // 1. まず指定ブランチ上でファイルの存在確認：GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
  let existingSha: string | undefined;
  try {
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "jinmyocho.com",
      },
    });
    if (getRes.ok) {
      const getData: { sha: string } = await getRes.json();
      // 存在していれば getData.sha に値がある
      if (getData && typeof getData.sha === "string") {
        existingSha = getData.sha;
      }
    } else if (getRes.status === 404) {
      // ファイル未存在の場合。existingSha は undefined のまま。
    } else {
      // その他エラー
      const errBody = await getRes.json().catch(() => ({}));
      throw new Error(
        `ファイル存在確認に失敗しました: status=${
          getRes.status
        }, body=${JSON.stringify(errBody)}`
      );
    }
  } catch (err) {
    // ネットワークエラー等
    if (err instanceof Error) {
      throw new Error(`ファイル存在確認中に例外が発生しました: ${err.message}`);
    }
    throw err;
  }

  // 2. PUT リクエストボディ作成。既存 SHA があれば更新、なければ新規作成
  const putBody: any = {
    message: existingSha ? `Update file: ${filename}` : `Add file: ${filename}`,
    content: base64Content,
    branch: branch,
    committer: {
      name: "File Uploader",
      email: "uploader@example.com",
    },
  };
  if (existingSha) {
    putBody.sha = existingSha;
  }

  // 3. PUT /repos/{owner}/{repo}/contents/{path}
  let contentResponse: any;
  try {
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "jinmyocho.com",
      },
      body: JSON.stringify(putBody),
    });
    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      throw new Error(
        `画像のアップロードに失敗しました: status=${
          putRes.status
        }, body=${JSON.stringify(errBody)}`
      );
    }
    contentResponse = await putRes.json();
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`画像アップロード中に例外が発生しました: ${err.message}`);
    }
    throw err;
  }

  // 4. raw.githubusercontent.com URL 組み立て（必要に応じて利用）
  //    GitHub Pages などで配信する場合、raw URL をそのまま CDN として使うのは推奨されませんが、
  //    GitHub Pages ブランチを publish する方式なら、raw ではなく GitHub Pages の URL を組み立てる必要があります。
  // ここでは raw.githubusercontent.com を返す例:
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(
    username
  )}/${encodeURIComponent(repoName)}/${encodeURIComponent(branch)}/${path}`;

  return {
    contentResponse,
    rawUrl,
  };
};

// GitHub Pages の状態を取得する関数
const getGitHubPagesStatus = async (
  token: string,
  username: string,
  repoName: string
): Promise<{ isEnabled: boolean; url?: string }> => {
  const response = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/pages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jinmyocho.com",
      },
    }
  );

  if (response.status === 404) {
    // GitHub Pages が設定されていない場合
    return { isEnabled: false };
  }

  if (!response.ok) {
    throw new Error(
      `GitHub Pages の状態取得に失敗しました: ${response.status}`
    );
  }

  const data: any = await response.json();
  return {
    isEnabled: true,
    url: data.html_url,
  };
};

// GitHub Pages を有効化する関数（既存チェック付き）
export const enableGitHubPages = async (
  token: string,
  username: string,
  repoName: string
): Promise<{ isAlreadyEnabled: boolean; url?: string }> => {
  try {
    // まず現在の状態を確認
    const status = await getGitHubPagesStatus(token, username, repoName);

    if (status.isEnabled) {
      console.log(`GitHub Pages は既に有効化されています: ${status.url}`);
      return {
        isAlreadyEnabled: true,
        url: status.url,
      };
    }

    // 有効化されていない場合は新規作成
    const response = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/pages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "jinmyocho.com",
        },
        body: JSON.stringify({
          source: {
            branch: "gh-pages",
            path: "/",
          },
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = "GitHub Pages の有効化に失敗しました";
      try {
        const error: any = await response.json();
        errorMessage = error.message || JSON.stringify(error);
      } catch {
        // JSONパースに失敗した場合はデフォルトメッセージを使用
      }
      throw new Error(errorMessage);
    }

    const data: any = await response.json();
    console.log(`GitHub Pages を有効化しました: ${data.html_url}`);

    return {
      isAlreadyEnabled: false,
      url: data.html_url,
    };
  } catch (error) {
    console.error("GitHub Pages の処理でエラーが発生しました:", error);
    throw error;
  }
};

export interface ImageResource {
  /** 画像ファイルの URL */
  imageUrl: string;
  /** 同名の JSON メタデータファイルの URL */
  metaUrl: string;
}

/**
 * 画像ファイルと同名の .json メタデータが存在する場合に、
 * それぞれの CDN URL（raw or GitHub Pages）ペアを返す関数
 */
export async function listImageResources(
  token: string,
  username: string,
  repoName: string,
  options?: {
    branch?: string;
    useRawUrl?: boolean;
  }
): Promise<ImageResource[]> {
  const branch = options?.branch ?? "gh-pages";
  const useRawUrl = options?.useRawUrl ?? false;

  // images/ ディレクトリ一覧取得
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(
    username
  )}/${encodeURIComponent(repoName)}/contents/images?ref=${encodeURIComponent(
    branch
  )}`;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "jinmyocho.com",
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`ネットワークエラー (images一覧取得): ${err.message}`);
    }
    throw err;
  }
  if (!res.ok) {
    if (res.status === 404) {
      return [];
    }
    let errBody: any;
    try {
      errBody = await res.json();
    } catch {
      errBody = { message: "レスポンス JSON 取得失敗" };
    }
    throw new Error(
      `images ディレクトリ一覧取得失敗: status=${
        res.status
      }, body=${JSON.stringify(errBody)}`
    );
  }

  let data: Array<{ name: string; type: "file" | "dir"; path: string }>;
  try {
    data = (await res.json()) as Array<{
      name: string;
      type: "file" | "dir";
      path: string;
    }>;
  } catch (err) {
    throw new Error(
      `JSON パースエラー (images一覧): ${(err as Error).message}`
    );
  }

  // ファイル一覧のみ
  const fileItems = data.filter((item) => item.type === "file");
  // .json ファイル名をセットにしておく
  const metaFileNames = new Set<string>();
  for (const item of fileItems) {
    if (item.name.toLowerCase().endsWith(".json")) {
      metaFileNames.add(item.name);
    }
  }
  // 画像候補: 拡張子が .json でないもの
  const imageFileItems = fileItems.filter(
    (item) => !item.name.toLowerCase().endsWith(".json")
  );

  const results: ImageResource[] = [];

  for (const imgItem of imageFileItems) {
    const name = imgItem.name;
    const lastDot = name.lastIndexOf(".");
    if (lastDot < 0) {
      // 拡張子なしファイルはスキップするか、必要に応じて扱う
      continue;
    }
    const basename = name.substring(0, lastDot);
    const metaFileName = `${basename}.json`;
    if (!metaFileNames.has(metaFileName)) {
      // メタデータがなければスキップ
      continue;
    }
    // URL 組み立て
    const encodedImageName = encodeURIComponent(imgItem.name);
    const encodedMetaName = encodeURIComponent(metaFileName);

    let imageUrl: string;
    let metaUrl: string;
    if (useRawUrl) {
      imageUrl = `https://raw.githubusercontent.com/${encodeURIComponent(
        username
      )}/${encodeURIComponent(repoName)}/${encodeURIComponent(
        branch
      )}/images/${encodedImageName}`;
      metaUrl = `https://raw.githubusercontent.com/${encodeURIComponent(
        username
      )}/${encodeURIComponent(repoName)}/${encodeURIComponent(
        branch
      )}/images/${encodedMetaName}`;
    } else {
      imageUrl = `https://${username}.github.io/${repoName}/images/${encodedImageName}`;
      metaUrl = `https://${username}.github.io/${repoName}/images/${encodedMetaName}`;
    }

    results.push({ imageUrl, metaUrl });
  }

  return results;
}

interface BuildOptions {
  owner: string;
  repo: string;
  /** YAML テンプレ名（既定: shrine.yml） */
  template?: string;
  /** Issue タイトル（既定: "[Shrine] 名称 - 都道府県/区域"） */
  title?: string;
  /** 追加ラベル */
  labels?: string[];
  /** assignees */
  assignees?: string[];
}

export function buildShrineIssueUrl(
  shrine: ShrinesRecord,
  opts: BuildOptions
): string {
  const {
    owner,
    repo,
    template = "shrine.yml",
    title = `[Shrine] ${shrine.名称 ?? "Unknown"} - ${shrine.都道府県 ?? ""}/${
      shrine.区域 ?? ""
    }`,
    labels = ["shrine"],
    assignees = [],
  } = opts;

  const base = `https://github.com/${encodeURIComponent(
    owner
  )}/${encodeURIComponent(repo)}/issues/new`;
  const qs = new URLSearchParams({ template, title });

  if (labels.length) qs.set("labels", labels.join(","));
  if (assignees.length) qs.set("assignees", assignees.join(","));

  /** --- 必須 6 フィールド ------------------------- */
  if (shrine.ID != null) qs.set("id", String(shrine.ID));
  if (shrine.名称) qs.set("name", shrine.名称);
  if (shrine.都道府県) qs.set("prefecture", shrine.都道府県);
  if (shrine.区域) qs.set("district", shrine.区域);
  if (shrine.緯度 != null) qs.set("lat", String(shrine.緯度));
  if (shrine.経度 != null) qs.set("lon", String(shrine.経度));

  /** --- 任意フィールド ---------------------------- */
  if (shrine.総称 || shrine.別名) {
    const lines = [
      shrine.総称 ? `総称: ${shrine.総称}` : "",
      shrine.別名 ? `別名: ${shrine.別名}` : "",
    ].filter(Boolean);
    qs.set("aliases", lines.join("\n"));
  }

  if (shrine.住所 || shrine.郵便番号 || shrine.アクセス) {
    qs.set(
      "address",
      [
        shrine.郵便番号 ? `郵便番号: ${shrine.郵便番号}` : "",
        shrine.住所 ? `住所: ${shrine.住所}` : "",
        shrine.アクセス ? `アクセス: ${shrine.アクセス}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  if (shrine.電話番号?.length) {
    qs.set(
      "tel",
      shrine.電話番号
        .map(
          (t) => `- 番号: ${t.番号 ?? ""}${t.説明 ? `, 説明: ${t.説明}` : ""}`
        )
        .join("\n")
    );
  }

  if (shrine.祭神?.length) {
    qs.set("deities", shrine.祭神.map((d) => `${d.ID} ${d.名称}`).join("\n"));
  }

  if (shrine.祭事?.length) {
    qs.set(
      "events",
      shrine.祭事
        .map((e) =>
          [
            `名称: ${e.名称}`,
            e.日付区分 && `日付区分: ${e.日付区分}`,
            e.開催月日 && `開催月日: ${e.開催月日}`,
            e.開催月 && `開催月: ${e.開催月}`,
            e.開催月第何週 && `開催月第何週: ${e.開催月第何週}`,
            e.開催月何曜日 && `開催月何曜日: ${e.開催月何曜日}`,
            e.旧暦 !== undefined && `旧暦: ${e.旧暦}`,
            e.備考 && `備考: ${e.備考}`,
          ]
            .filter(Boolean)
            .join(", ")
        )
        .join("\n")
    );
  }

  if (shrine.raw) {
    qs.set("notes", stripFrontmatter(shrine.raw));
  }

  return `${base}?${qs.toString()}`;
}

export function convertCdnUrlToGitHubUrl(
  cdnUrl: string,
  branch = "gh-pages"
): string | null {
  try {
    const url = new URL(cdnUrl);
    if (!url.hostname.endsWith(".github.io")) {
      return null;
    }

    const username = url.hostname.split(".github.io")[0];
    const pathParts = url.pathname.split("/").filter((part) => part !== "");
    if (pathParts.length === 0) return null;

    const repo = pathParts[0];
    const filePath = pathParts.slice(1).join("/");

    return `https://github.com/${username}/${repo}/blob/${branch}/${filePath}`;
  } catch (e) {
    return null;
  }
}
