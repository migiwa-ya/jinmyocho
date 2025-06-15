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

export async function compressImageToJpeg(
  blob: Blob,
  maxWidth: number = 640,
  quality: number = 0.8
): Promise<Blob> {
  const imageBitmap = await createImageBitmap(blob);
  const scale = maxWidth / imageBitmap.width;
  const newWidth = maxWidth;
  const newHeight = imageBitmap.height * scale;
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context not available");

  ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (compressedBlob) => {
        if (compressedBlob) {
          resolve(compressedBlob);
        } else {
          reject(new Error("Image compression failed"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

// Base64 エンコード（UTF-8 を保つための方法）
// Cloudflare Workers やブラウザ環境では atob/btoa が使えるが、btoa は binary string 期待なので、
// JSON が ASCII 範囲外文字を含む場合は以下のようにエンコードします。
export function utf8ToBase64(str: string): string {
  // UTF-8 → %HH... 形式にしてからデコード
  // atob(unescape(encodeURIComponent(str))) 相当
  try {
    // Cloudflare Workers などで TextEncoder が使える環境なら：
    if (typeof TextEncoder !== "undefined") {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      // bytes は Uint8Array。Base64 文字列に変換:
      // Cloudflare Workers 環境では globalThis.btoa はない場合があるので、Buffer か自前実装が必要。
      // Workers では atob/btoa ある場合もあるが確実性低いので、ここでは簡易的に：
      let binaryStr = "";
      bytes.forEach((b) => (binaryStr += String.fromCharCode(b)));
      return btoa(binaryStr);
    } else {
      // encodeURIComponent + unescape + btoa
      return btoa(unescape(encodeURIComponent(str)));
    }
  } catch {
    // フォールバック
    return btoa(unescape(encodeURIComponent(str)));
  }
}
