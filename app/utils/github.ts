import { ShrinesRecord } from "../staticql/staticql-types";
import { stripFrontmatter } from "./parse";

export const createRepository = async (token: string, repoName: string) => {
  // ① リポジトリ作成
  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      description: "[神名帳](https://jinmyocho.com/) 投稿用データ",
      private: false,
      auto_init: true, // READMEあり（mainブランチあり）
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error) || "リポジトリ作成に失敗しました");
  }

  const repo = await response.json();

  // ② ユーザー名を取得
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "jinja-image-app",
    },
  });
  const user: GitHubUser = await userRes.json();
  const username = user.login;

  // ③ .nojekyll ファイルを追加
  const putRes = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/contents/.nojekyll`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Add .nojekyll to disable Jekyll processing",
        content: "", // 空文字をbase64エンコード
        branch: "main",
      }),
    }
  );

  if (!putRes.ok) {
    const error = await putRes.json();
    throw new Error(JSON.stringify(error) || ".nojekyll 作成に失敗しました");
  }

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
        },
      }
    );
    return response.ok;
  } catch (error) {
    return false;
  }
};

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

export const getUsername = async (token: string) => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) throw new Error("GitHubユーザー情報の取得に失敗しました");

  const user: GitHubUser = await response.json();

  return user.login;
};

export const uploadImageToRepo = async (
  token: string,
  username: string,
  repoName: string,
  filename: string,
  base64Content: any
) => {
  const path = `images/${filename}`;

  const response = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Add image: ${filename}`,
        content: base64Content,
        committer: {
          name: "Image Uploader",
          email: "uploader@example.com",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    throw new Error(
      JSON.stringify(error) || "画像のアップロードに失敗しました"
    );
  }

  return response.json();
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
        },
        body: JSON.stringify({
          source: {
            branch: "main",
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

export async function listImageCDNUrls(
  token: string,
  username: string,
  repoName: string
): Promise<string[]> {
  const res = await fetch(
    `https://api.github.com/repos/${username}/${repoName}/contents/images`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "jinja-image-app",
      },
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      // ディレクトリがまだ存在しない
      return [];
    }
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }

  const data = (await res.json()) as Array<{
    name: string;
    type: "file" | "dir";
    path: string;
  }>;

  return data
    .filter((item) => item.type === "file")
    .map(
      (item) =>
        `https://${username}.github.io/${repoName}/images/${encodeURIComponent(
          item.name
        )}`
    );
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
