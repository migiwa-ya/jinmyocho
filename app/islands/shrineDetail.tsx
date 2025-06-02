import { useEffect, useState } from "hono/jsx";
import { loadStaticQL } from "../staticql/client";
import { encodeGeohash } from "../utils/geohash";
import { ShrinesRecord } from "../staticql/staticql-types";
import { parseMarkdown, stripFrontmatter } from "../utils/parse";

export default function ShrineDetail({ slug }: { slug: string }) {
  const [shrine, setShrine] = useState<ShrinesRecord | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

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
        setContent(parseMarkdown(stripFrontmatter(result.raw)));
      } else {
        setContent("");
      }

      setLoading(false);
    })();
  }, [slug]);

  return (
    <div class="max-w-4xl mx-auto mt-8 p-6 bg-white text-gray-700">
      {loading ? (
        <div class="text-center text-gray-500 py-8">Loading...</div>
      ) : !shrine ? (
        <div class="text-center text-gray-500 py-8">Not found</div>
      ) : (
        <>
          <header class="mb-8">
            <h1 class="text-4xl font-extrabold text-gray-900">{shrine.名称}</h1>
            {shrine.名称読み && (
              <p class="mt-1 text-lg text-gray-600">{shrine.名称読み}</p>
            )}
            {shrine.別名 && (
              <p class="mt-3 italic text-gray-500">別名: {shrine.別名}</p>
            )}
          </header>

          <section class="mb-8 space-y-3">
            <h2 class="text-xl font-bold mt-6 mb-3">所在地情報</h2>
            <p class="text-gray-700">
              {shrine.郵便番号 && <span>〒{shrine.郵便番号}</span>}{" "}
              {shrine.住所}
            </p>
            <a
              href={`/s?g=${encodeGeohash(shrine.緯度, shrine.経度, 6)}`}
              rel="noopener noreferrer"
              class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              周辺を検索する
            </a>
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
                    {festival.名称}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <article class="markdown-content mt-8">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
        </>
      )}
    </div>
  );
}
