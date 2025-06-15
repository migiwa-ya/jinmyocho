import { useEffect, useState } from "hono/jsx";
import { ListResult } from "../../routes/api/images/list";
import { convertCdnUrlToGitHubUrl, ImageResource } from "../../utils/github";

interface ImageMeta {
  userName: string;
  ccLicense: string;
  description?: string;
}

export default function ImageList() {
  const [images, setImages] = useState<ImageResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageResource | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [env, setEnv] = useState<Window["__ENV__"]>();
  const [metaDataMap, setMetaDataMap] = useState<
    Record<string, ImageMeta | null>
  >({});

  useEffect(() => {
    // images が変わるたびにフェッチ
    images.forEach((img) => {
      const { metaUrl } = img;
      if (!metaUrl) return;
      // まだフェッチしていなければ実行
      if (metaDataMap[metaUrl] === undefined) {
        // 一旦 null をセットして「読み込み中」マーク
        setMetaDataMap((prev) => ({ ...prev, [metaUrl]: null }));
        fetch(metaUrl)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch meta: ${res.status}`);
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
              setMetaDataMap((prev) => ({ ...prev, [metaUrl]: meta }));
            } else {
              console.warn(`Invalid meta format at ${metaUrl}`, data);
              setMetaDataMap((prev) => ({ ...prev, [metaUrl]: null }));
            }
          })
          .catch((err) => {
            console.warn(`Error fetching meta from ${metaUrl}`, err);
            setMetaDataMap((prev) => ({ ...prev, [metaUrl]: null }));
          });
      }
    });
  }, [images]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__ENV__) {
      setEnv(window.__ENV__);
    }
  }, []);

  if (!env) {
    return (
      <div class="flex items-center justify-center min-h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/images/list");
        const result = (await response.json()) as ListResult;
        if ("error" in result) {
          throw new Error(result.error);
        }

        setImages(result.images);
      } catch (error) {
        console.error("画像の取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [env]);

  const openModal = (image: ImageResource) => {
    setSelectedImage(image);
    setCopied(false);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    if (selectedImage) {
      try {
        await navigator.clipboard.writeText(selectedImage.imageUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("クリップボードへのコピーに失敗しました:", error);
      }
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center min-h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div class="text-center py-12">
        <p class="text-gray-500">画像がありません</p>
      </div>
    );
  }

  return (
    <>
      <div
        class={`m-4 p-4 rounded-md border text-gray-600 bg-gray-50 border-gray-200`}
      >
        <div class="flex items-start space-x-2">
          <div class="text-xs">
            ※画像が表示されない場合は少し間を開けてから読み込んでください
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {images.map((image, index) => (
          <div
            key={index}
            class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer transition-transform hover:scale-105 shadow-sm hover:shadow-md"
            onClick={() => openModal(image)}
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <img
                src={image.imageUrl}
                alt={`画像 ${index + 1}`}
                class="relative z-10 w-full h-full object-cover transition-opacity group-hover:opacity-90"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>

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
                src={selectedImage.imageUrl}
                class="max-w-full max-h-[70vh] object-contain"
              />

              <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 text-right">
                [ by {metaDataMap[selectedImage.metaUrl]?.userName},{" "}
                {metaDataMap[selectedImage.metaUrl]?.ccLicense} ]
              </div>
            </div>

            {/* URL コピー部分 */}
            <div class="p-4 bg-gray-50 border-t">
              {metaDataMap[selectedImage.metaUrl]?.description && (
                <p className="pb-2 text-sm text-gray-700 line-clamp-2">
                  {metaDataMap[selectedImage.metaUrl]?.description}
                </p>
              )}
              <div class="flex items-center space-x-2">
                <div class="flex-1 min-w-0">
                  <input
                    type="text"
                    value={selectedImage.imageUrl}
                    readOnly
                    class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={copyToClipboard}
                  class={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                    copied
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <span>コピー済み</span>
                    </>
                  ) : (
                    <>
                      <span>コピー</span>
                    </>
                  )}
                </button>

                <a
                  class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
                  href={convertCdnUrlToGitHubUrl(selectedImage.imageUrl) ?? ""}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* モーダル背景クリックで閉じる */}
      {selectedImage && (
        <div class="fixed inset-0 z-40" onClick={closeModal}></div>
      )}
    </>
  );
}
