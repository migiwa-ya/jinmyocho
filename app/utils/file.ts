/**
 * ランダムファイル名を生成
 *
 * @param opts
 *  - ext?: 拡張子 (例 "png" / ".txt")   デフォルト: なし
 *  - prefix?: 先頭に付ける文字列       デフォルト: なし
 *  - timestamp?: true で ISO 日付を付加 デフォルト: true
 * @returns 例: "2025-06-14-6cdc5609-9a43-462d-b109-9abc3af2afab.png"
 */
export function randomFilename(
  opts: {
    ext?: string;
    prefix?: string;
    timestamp?: boolean;
  } = {}
): string {
  const { ext = "", prefix = "", timestamp = true } = opts;

  // UUID v4 を生成（Node でもブラウザでも OK）
  const uuid =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : [...crypto.getRandomValues(new Uint8Array(16))]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

  const ts = timestamp ? new Date().toISOString().slice(0, 10) + "-" : "";
  const cleanExt = ext ? (ext.startsWith(".") ? ext : `.${ext}`) : "";

  return `${prefix}${ts}${uuid}${cleanExt}`;
}

export const fileToBase64 = (file: Blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 =
        typeof reader?.result === "string" ? reader?.result?.split(",")[1] : "";

      resolve(base64);
    };
    reader.onerror = reject;
  });
};
