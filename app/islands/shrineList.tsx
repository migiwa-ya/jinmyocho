import { useEffect, useState } from "hono/jsx";
import { loadStaticQL } from "../staticql/client";
import {
  ShrinesCustomIndexKeys,
  ShrinesRecord,
} from "../staticql/staticql-types";
import { ngram } from "../utils/ngram";

export function ShrineList({ name }: { name: string }) {
  const [items, setItems] = useState<ShrinesRecord[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);

  const values = ngram(name, 2);

  const fetchMore = async () => {
    setLoading(true);
    try {
      const staticql = await loadStaticQL();
      let query = staticql
        .from<ShrinesRecord, ShrinesCustomIndexKeys>("shrines")
        .pageSize(20)
        .cursor(cursor);

      if (values.length === 1) {
        query = query.where("nameBigram", "startsWith", values[0]);
      } else {
        for (const val of values) {
          query = query.where("nameBigram", "eq", val);
        }
      }

      const res = await query.exec();

      setItems((prev) => [...prev, ...res.data]);
      setCursor(res.pageInfo.endCursor);
      setHasNextPage(!!res.pageInfo.hasNextPage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMore();
  }, []);

  return (
    <div class="p-4 space-y-4">
      {loading && items.length === 0 ? (
        <div class="text-center py-8">Loading...</div>
      ) : !loading && items.length === 0 ? (
        <div class="text-center py-8">Not found</div>
      ) : (
        <>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((i) => (
              <a
                key={i.slug}
                href={`/s/${i.slug}`}
                class="block p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
              >
                <h3 class="text-lg font-semibold mb-2">{i.名称}</h3>
                {i.住所 && (
                  <p class="text-sm text-gray-600 mb-1">{i.住所}</p>
                )}
                <p class="text-sm text-gray-500">
                  {i.都道府県} {i.区域}
                </p>
                {i.祭神 && i.祭神.length > 0 && (
                  <p class="mt-2 text-sm text-gray-600">
                    <span class="font-medium">祭神：</span>
                    {i.祭神.map((d) => d.名称).join("、")}
                  </p>
                )}
              </a>
            ))}
          </div>
          {hasNextPage && (
            <div class="flex justify-center">
              <button
                onClick={fetchMore}
                disabled={loading}
                class={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition${
                  loading ? " opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Loading..." : "もっと見る"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
