import { useEffect, useState } from "hono/jsx";
import { loadStaticQL } from "../staticql/client";
import { encodeGeohash } from "../utils/geohash";
import { ShrinesRecord } from "../staticql/staticql-types";
import { parseMarkdown, stripFrontmatter } from "../utils/parse";
import { formatDate, getCalculatedDateJa } from "../utils/festival";
import { buildShrineIssueUrl } from "../utils/github";
import { sanitizeHtml } from "../utils/sanitaize";
interface ImageMeta {
  userName: string;
  ccLicense: string;
  description?: string;
}
type 画像 = NonNullable<ShrinesRecord["画像"]>[number];

export default function ShrineDetail({ slug }: { slug: string }) {
  const [shrine, setShrine] = useState<ShrinesRecord | null>(null);
  const [issueUrl, setIssueUrl] = useState<string | null>();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [metaDataMap, setMetaDataMap] = useState<
    Record<string, ImageMeta | null>
  >({});

  const [selectedImage, setSelectedImage] = useState<画像 | null>(null);

  const openModal = (image: 画像) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      let result: ShrinesRecord | null;

      try {
        const staticql = await loadStaticQL();
        result = await staticql.from<ShrinesRecord>("shrines").find(slug);
      } catch {
        result = null;
      }

      setShrine(result ?? null);

      if (result) {
        setContent(sanitizeHtml(parseMarkdown(stripFrontmatter(result.raw))));

        setIssueUrl(
          buildShrineIssueUrl(result, {
            owner: "migiwa-ya",
            repo: "dataset-shrines",
            assignees: ["reviewer"],
          })
        );
      } else {
        setContent("");
      }

      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!shrine?.画像) {
      return;
    }
    // images 配列
    const images: string[] = shrine.画像;
    images.forEach((imageUrl) => {
      // すでに fetch 済み or fetch 中にマークしてあればスキップ
      if (imageUrl in metaDataMap) {
        return;
      }
      // まずマップにキーを登録して「読み込み中/マーク済み」とする
      setMetaDataMap((prev) => ({ ...prev, [imageUrl]: null }));
      // metaUrl を Derive: 画像 URL の拡張子部分を .json に置き換え
      // 例: https://.../images/foo.jpg -> https://.../images/foo.json
      let metaUrl: string;
      try {
        const urlObj = new URL(imageUrl);
        const pathname = urlObj.pathname;
        const idx = pathname.lastIndexOf(".");
        if (idx < 0) {
          // 拡張子がない場合はスキップ
          return;
        }
        const newPath = pathname.substring(0, idx) + ".json";
        urlObj.pathname = newPath;
        metaUrl = urlObj.toString();
      } catch {
        // URL 解析失敗なら文字列操作で代替
        const idx = imageUrl.lastIndexOf(".");
        if (idx < 0) return;
        metaUrl = imageUrl.substring(0, idx) + ".json";
      }
      // fetch metaUrl
      fetch(metaUrl)
        .then((res) => {
          if (!res.ok) {
            // 404 など: メタデータがない場合は null のまま
            throw new Error(`Meta fetch failed: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          const imageMeta = data as ImageMeta;
          // data が { userName: string; ccLicense: string; description?: string }
          if (
            typeof imageMeta.userName === "string" &&
            typeof imageMeta.ccLicense === "string"
          ) {
            const meta: ImageMeta = {
              userName: imageMeta.userName,
              ccLicense: imageMeta.ccLicense,
            };
            if (typeof imageMeta.description === "string") {
              meta.description = imageMeta.description;
            }
            setMetaDataMap((prev) => ({ ...prev, [imageUrl]: meta }));
          } else {
            console.warn("Invalid meta format for", imageUrl, data);
            // 型不正なら null のまま
          }
        })
        .catch((err) => {
          console.warn("Error fetching meta for", imageUrl, err);
          // 失敗時はそのまま null
        });
    });
    // images 配列が変わるたびに実行。metaDataMap は deps に入れず、初回確認のみ行う。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shrine]);

  return (
    <div class="max-w-4xl mx-auto mt-8 p-6 bg-white text-gray-700">
      {loading ? (
        <div class="text-center text-gray-500 py-8">Loading...</div>
      ) : !shrine ? (
        <div class="text-center text-gray-500 py-8">Not found</div>
      ) : (
        <>
          <header class="mb-8 pb-4 border-b border-gray-400">
            <h1 class="text-4xl font-extrabold text-gray-900">{shrine.名称}</h1>
            {shrine.名称読み && (
              <p class="mt-1 text-lg text-gray-600">{shrine.名称読み}</p>
            )}
            {shrine.別名 && (
              <p class="mt-3 italic text-gray-500">別名: {shrine.別名}</p>
            )}

            <div class="flex gap-4 text-sm">
              <a
                class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
                href={`https://github.com/migiwa-ya/dataset-shrines/blob/main/sources/${shrine.ID}.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              {issueUrl && (
                <a
                  class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
                  href={issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  修正リクエスト（GitHub Issue）
                </a>
              )}
            </div>
          </header>

          <section class="mb-8 space-y-3">
            <h2 class="text-xl font-bold mt-6 mb-3">所在地情報</h2>
            <p class="text-gray-700">
              {shrine.郵便番号 && <span>〒{shrine.郵便番号}</span>}{" "}
              {shrine.住所}
            </p>

            <div class="flex gap-4 text-sm">
              <a
                href={`/s?g=${encodeGeohash(shrine.緯度, shrine.経度, 6)}`}
                class="inline-block text-blue-600 hover:text-blue-800 underline"
              >
                周辺を検索する
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shrine.緯度},${shrine.経度}`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-block text-blue-600 hover:text-blue-800 underline"
              >
                Google マップで開く
              </a>
            </div>
          </section>

          {shrine.祭神 && shrine.祭神.length > 0 && (
            <section class="mb-8">
              <h2 class="text-xl font-bold mt-6 mb-3">祭神</h2>
              <ul class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {shrine.祭神.map((deity) => (
                  <li
                    key={deity.ID}
                    class="bg-gray-100 p-2 rounded text-center text-gray-700"
                  >
                    {deity.名称}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {shrine.祭事 && shrine.祭事.length > 0 && (
            <section class="mb-8">
              <h2 class="text-xl font-bold mt-6 mb-3">祭事</h2>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {shrine.祭事.map((festival) => (
                  <li
                    key={festival.名称}
                    class="bg-gray-100 p-2 rounded text-gray-700"
                  >
                    {festival.名称}{" "}
                    {getCalculatedDateJa(festival)
                      .map((date) => formatDate(date))
                      .join("~")}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {shrine.画像 && shrine.画像.length > 0 && (
            <section class="mb-8">
              <h2 class="text-xl font-bold mt-6 mb-3">画像</h2>
              <div class="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                {shrine.画像.map((画像) => (
                  <div
                    key={画像}
                    class="group relative aspect-square overflow-hidden bg-gray-100 cursor-pointer transition-transform hover:scale-105 shadow-sm hover:shadow-md"
                    onClick={() => openModal(画像)}
                  >
                    <img
                      src={画像}
                      class="z-1 relative w-full h-full object-cover transition-opacity group-hover:opacity-90"
                      loading="lazy"
                    />
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* モーダル */}
          {selectedImage && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal();
                }
              }}
              class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 bg-opacity-75"
            >
              <div class="relative max-w-4xl max-h-full w-full bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* 閉じるボタン */}
                <button
                  onClick={closeModal}
                  class="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    class="size-6 justify-self-center"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* 画像 */}
                <div class="relative flex items-center justify-center bg-gray-50">
                  <img
                    src={selectedImage}
                    class="max-w-full max-h-[70vh] object-contain"
                  />

                  <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-right">
                    [ by {metaDataMap[selectedImage]?.userName},{" "}
                    {metaDataMap[selectedImage]?.ccLicense} ]
                  </div>
                </div>

                <div class="p-4 bg-gray-50 border-t">
                  {metaDataMap[selectedImage]?.description}
                </div>
              </div>
            </div>
          )}

          {/* モーダル背景クリックで閉じる */}
          {selectedImage && (
            <div class="fixed inset-0 z-40" onClick={closeModal}></div>
          )}

          <article class="markdown-content mt-8">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
        </>
      )}
    </div>
  );
}
