import { useEffect, useRef, useState } from "hono/jsx";
import { UploadResult } from "../../routes/api/images/upload";
import { compressImageToJpeg } from "../../utils/file";
import { CCLicenseSelector } from "./CCLicenseSelector";
import { NameResult } from "../../routes/api/users/name";
import { loadStaticQL } from "../../staticql/client";
import {
  ShrinesCustomIndexKeys,
  ShrinesRecord,
} from "../../staticql/staticql-types";
import { ngram } from "../../utils/ngram";

type SelectedShrine = {
  slug: string;
  name: string;
};

export default function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState<Blob | null>();

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState(""); // 'success' or 'error'
  const [progress, setProgress] = useState("");
  const [env, setEnv] = useState<Window["__ENV__"]>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState("");

  // 神社選択
  const [selectedShrine, setSelectedShrine] = useState<SelectedShrine | null>(
    null
  );
  const [shrineQuery, setShrineQuery] = useState("");
  const [shrineResults, setShrineResults] = useState<ShrinesRecord[]>([]);
  const [shrineSearching, setShrineSearching] = useState(false);
  const [showShrineDropdown, setShowShrineDropdown] = useState(false);
  const shrineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__ENV__) {
      setEnv(window.__ENV__);
    }

    // クエリパラメータから shrine slug を取得
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const shrineSlug = params.get("shrine");
      const shrineName = params.get("name");
      if (shrineSlug) {
        setSelectedShrine({
          slug: shrineSlug,
          name: shrineName || shrineSlug,
        });
      }
    }

    (async () => {
      try {
        const response = await fetch("/api/users/name");
        const result = (await response.json()) as NameResult;
        if ("error" in result) {
          throw new Error(result.error);
        }

        setUserName(result.userName);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      }
    })();
  }, []);

  // 神社検索
  useEffect(() => {
    if (!shrineQuery.trim()) {
      setShrineResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setShrineSearching(true);
      try {
        const keys = ngram(shrineQuery, 2);
        const staticql = await loadStaticQL();
        let query = staticql
          .from<ShrinesRecord, ShrinesCustomIndexKeys>("shrines")
          .pageSize(10);

        if (keys.length === 1) {
          query = query.where("nameBigram", "startsWith", keys[0]);
        } else {
          for (const key of keys) {
            query = query.where("nameBigram", "eq", key);
          }
        }

        const res = await query.exec();
        setShrineResults(res.data);
        setShowShrineDropdown(true);
      } catch (error) {
        console.error("神社検索に失敗しました:", error);
      } finally {
        setShrineSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [shrineQuery]);

  if (!env) {
    return (
      <div class="flex items-center justify-center min-h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span class="ml-2 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  // ファイル選択時の処理
  const handleFileSelect = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // ファイルタイプチェック
    if (!file.type.startsWith("image/")) {
      setResult("画像ファイルを選択してください");
      setResultType("error");
      return;
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      setResult("ファイルサイズが10MBを超えています");
      setResultType("error");
      return;
    }

    setSelectedFile(file);
    setResult(null);

    // プレビュー画像作成
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(String(e?.target?.result));
    };
    reader.readAsDataURL(file);
  };

  // メイン処理：画像アップロード
  const uploadImage = async () => {
    if (!selectedFile) {
      setResult("画像ファイルを選択してください");
      setResultType("error");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      setResult(null);

      const pressed = await compressImageToJpeg(selectedFile);

      const formData = new FormData();
      formData.append("file", pressed);
      formData.append("description", descriptionRef.current?.value ?? "");
      formData.append("license", licenseRef.current?.value ?? "");
      if (selectedShrine) {
        formData.append("shrineSlug", selectedShrine.slug);
      }

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      const result: UploadResult = await response.json();

      if ("error" in result) {
        throw new Error(result.error);
      }

      setResult(`画像が正常にアップロードされました！`);
      setResultType("success");

      // 成功時にフォームをリセット
      setSelectedFile(null);
      setPreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setResult(`エラー: ${JSON.stringify(error)}`);
      setResultType("error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const fakeEvent = { target: { files: [file] } };
        handleFileSelect(fakeEvent);
      }
    }
  };

  const handleSelectShrine = (shrine: ShrinesRecord) => {
    setSelectedShrine({ slug: shrine.slug, name: shrine.名称 });
    setShrineQuery("");
    setShrineResults([]);
    setShowShrineDropdown(false);
  };

  const handleClearShrine = () => {
    setSelectedShrine(null);
    setShrineQuery("");
    setShrineResults([]);
  };

  return (
    <div class="max-w-lg mx-auto p-6 mt-4 bg-white">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">
          GitHub 画像アップロード
        </h2>
        <p class="text-gray-600 text-sm">
          画像はあなたの
          <a
            href={`https://github.com/${userName}/${env.IMAGE_REPOSITORY_NAME}`}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block text-blue-600 hover:text-blue-800 underline"
          >
            GitHub レポジトリ
          </a>
          にアップロードされます（アップロードされるまでアクセスできません）。画像は一般公開されます。
        </p>
      </div>

      <div class="space-y-4">
        {/* 神社選択 */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            神社
          </label>

          {selectedShrine ? (
            <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
              <a
                href={`/s/${selectedShrine.slug}`}
                class="text-sm text-blue-700 hover:text-blue-900 underline flex-1"
              >
                {selectedShrine.name}
              </a>
              <button
                type="button"
                onClick={handleClearShrine}
                class="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          ) : (
            <div class="relative">
              <input
                ref={shrineInputRef}
                type="text"
                value={shrineQuery}
                onInput={(e: any) => setShrineQuery(e.target.value)}
                onFocus={() => {
                  if (shrineResults.length > 0) setShowShrineDropdown(true);
                }}
                onBlur={() => {
                  // ドロップダウンのクリックが先に処理されるよう遅延
                  setTimeout(() => setShowShrineDropdown(false), 200);
                }}
                placeholder="神社名で検索..."
                class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {shrineSearching && (
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}

              {showShrineDropdown && shrineResults.length > 0 && (
                <ul class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {shrineResults.map((shrine) => (
                    <li
                      key={shrine.slug}
                      onMouseDown={() => handleSelectShrine(shrine)}
                      class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <span class="font-medium text-gray-800">
                        {shrine.名称}
                      </span>
                      <span class="ml-2 text-gray-500 text-xs">
                        {shrine.都道府県}
                        {shrine.区域}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {showShrineDropdown &&
                !shrineSearching &&
                shrineQuery.trim() !== "" &&
                shrineResults.length === 0 && (
                  <div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                    該当する神社が見つかりませんでした
                  </div>
                )}
            </div>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            説明 <span class="text-red-500">*</span>
          </label>

          <input
            ref={descriptionRef}
            name="description"
            type="text"
            class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            ライセンス <span class="text-red-500">*</span>
          </label>

          <CCLicenseSelector selectRef={licenseRef} />
        </div>

        {/* ファイル選択エリア */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            画像ファイル <span class="text-red-500">*</span>
          </label>

          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {preview && selectedFile ? (
              <div class="space-y-3">
                <img
                  src={preview}
                  alt="Preview"
                  class="max-w-full max-h-40 mx-auto rounded border"
                />
                <p class="text-sm text-gray-600">
                  {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div class="space-y-2">
                <div class="text-4xl">📁</div>
                <p class="text-gray-600">
                  画像をドラッグ&ドロップ または クリックして選択
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept=".jpg,.jpeg"
              onChange={handleFileSelect}
              class="hidden"
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => fileInputRef?.current?.click()}
              class="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors border-1 border-b-4 border-gray-400"
              disabled={loading}
            >
              ファイルを選択
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">対応形式: JPG（最大10MB）</p>
        </div>

        {/* アップロードボタン */}
        <button
          onClick={uploadImage}
          disabled={
            loading || !selectedFile || !env.IMAGE_REPOSITORY_NAME.trim()
          }
          class={`w-full py-3 px-4 rounded-md font-medium text-white transition-all duration-200 ${
            loading || !selectedFile || !env.IMAGE_REPOSITORY_NAME.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transform hover:scale-[1.02]"
          }`}
        >
          {loading ? (
            <div class="flex items-center justify-center space-x-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{progress || "アップロード中..."}</span>
            </div>
          ) : (
            "画像をアップロード"
          )}
        </button>

        {/* 結果表示 */}
        {result && (
          <div
            class={`p-4 rounded-md border ${
              resultType === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <div class="flex items-start space-x-2">
              <div class="flex-shrink-0">
                {resultType === "success" ? "✅" : "❌"}
              </div>
              <div class="text-sm">
                {result}
                {resultType === "success" && (
                  <p class="mt-1 text-xs text-green-600">
                    後ほど{" "}
                    <a
                      class="text-md text-blue-600 underline"
                      href="/dashboard/images"
                    >
                      一覧ページ
                    </a>
                    で確認できます。
                    <br />
                    ※反映に時間がかかることがあります。
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 処理中のプログレス */}
        {loading && progress && (
          <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm text-blue-800">{progress}</span>
            </div>
          </div>
        )}

        {/* 説明テキスト */}
        <div class="bg-gray-50 rounded-md p-3 text-xs text-gray-600">
          <strong>処理の流れ:</strong>
          <ol class="mt-1 ml-4 list-decimal space-y-1">
            <li>リポジトリの存在確認</li>
            <li>存在しない場合はリポジトリを自動作成</li>
            <li>画像を images/ フォルダに保存</li>
            <li>GitHub Pages へデプロイ</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
