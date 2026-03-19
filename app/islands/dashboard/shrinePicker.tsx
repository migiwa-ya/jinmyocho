import { useEffect, useRef, useState } from "hono/jsx";
import { loadStaticQL } from "../../staticql/client";
import {
  CitiesCustomIndexKeys,
  CitiesRecord,
  ShrinesCustomIndexKeys,
  ShrinesRecord,
} from "../../staticql/staticql-types";
import { ngram } from "../../utils/ngram";

export type SelectedShrine = {
  slug: string;
  name: string;
};

type SelectedCity = {
  name: string;
  geohash: string;
};

interface ShrinePickerProps {
  value: SelectedShrine | null;
  onChange: (shrine: SelectedShrine | null) => void;
  /** コンパクト表示（imageList モーダル内用） */
  compact?: boolean;
}

export function ShrinePicker({
  value,
  onChange,
  compact = false,
}: ShrinePickerProps) {
  // 市区町村検索
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CitiesRecord[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);

  // 神社検索
  const [shrineQuery, setShrineQuery] = useState("");
  const [shrineResults, setShrineResults] = useState<ShrinesRecord[]>([]);
  const [shrineSearching, setShrineSearching] = useState(false);
  const [showShrineDropdown, setShowShrineDropdown] = useState(false);

  const cityInputRef = useRef<HTMLInputElement>(null);
  const shrineInputRef = useRef<HTMLInputElement>(null);

  // 市区町村検索
  useEffect(() => {
    if (!cityQuery.trim()) {
      setCityResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCitySearching(true);
      try {
        const keys = ngram(cityQuery, 2);
        const staticql = await loadStaticQL();
        let query = staticql
          .from<CitiesRecord, CitiesCustomIndexKeys>("cities")
          .orderBy("addressBigram")
          .pageSize(20);

        if (keys.length === 1) {
          query = query.where("addressBigram", "startsWith", keys[0]);
        } else {
          for (const key of keys) {
            query = query.where("addressBigram", "eq", key);
          }
        }

        const res = await query.exec();
        setCityResults(res.data);
        setShowCityDropdown(true);
      } catch (error) {
        console.error("市区町村検索に失敗しました:", error);
      } finally {
        setCitySearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityQuery]);

  // 神社検索: 神社名入力時に nameBigram で検索、市区町村選択時は geohash で絞り込み
  useEffect(() => {
    // 市区町村選択済み + 神社名未入力 → geohash のみで検索
    if (selectedCity && !shrineQuery.trim()) {
      const timer = setTimeout(async () => {
        setShrineSearching(true);
        try {
          const staticql = await loadStaticQL();
          const prefix = selectedCity.geohash.slice(0, 4);
          const res = await staticql
            .from<ShrinesRecord, ShrinesCustomIndexKeys>("shrines")
            .where("geohash", "startsWith", prefix)
            .exec();

          setShrineResults(res.data);
          setShowShrineDropdown(true);
        } catch (error) {
          console.error("神社検索に失敗しました:", error);
        } finally {
          setShrineSearching(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // 神社名入力あり → nameBigram で検索
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
          .pageSize(20);

        if (keys.length === 1) {
          query = query.where("nameBigram", "startsWith", keys[0]);
        } else {
          for (const key of keys) {
            query = query.where("nameBigram", "eq", key);
          }
        }

        // 市区町村選択済みなら geohash でも絞り込み
        if (selectedCity) {
          const prefix = selectedCity.geohash.slice(0, 4);
          query = query.where("geohash", "startsWith", prefix);
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
  }, [shrineQuery, selectedCity]);

  const handleSelectCity = (city: CitiesRecord) => {
    setSelectedCity({
      name: city.都道府県 + (city.郡 ?? "") + city.市区町村,
      geohash: city.geohash,
    });
    setCityQuery("");
    setCityResults([]);
    setShowCityDropdown(false);
  };

  const handleClearCity = () => {
    setSelectedCity(null);
    setShrineResults([]);
  };

  const handleSelectShrine = (shrine: ShrinesRecord) => {
    onChange({ slug: shrine.slug, name: shrine.名称 });
    setShowShrineDropdown(false);
  };

  const handleClear = () => {
    onChange(null);
    setSelectedCity(null);
    setCityQuery("");
    setShrineQuery("");
    setShrineResults([]);
  };

  const inputClass = compact
    ? "w-full px-2 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    : "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const dropdownClass = compact
    ? "absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto"
    : "absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto";

  // 選択済み表示
  if (value) {
    if (compact) {
      return (
        <div class="flex items-center gap-2">
          <a
            href={`/s/${value.slug}`}
            class="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            {value.name}
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            class="text-gray-400 hover:text-blue-600 text-xs"
          >
            変更
          </button>
          <button
            type="button"
            onClick={handleClear}
            class="text-gray-400 hover:text-red-600 text-xs"
          >
            解除
          </button>
        </div>
      );
    }
    return (
      <div class="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
        <a
          href={`/s/${value.slug}`}
          class="text-sm text-blue-700 hover:text-blue-900 underline flex-1"
        >
          {value.name}
        </a>
        <button
          type="button"
          onClick={handleClear}
          class="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>
    );
  }

  // 未選択: 市区町村 + 神社名 の並列入力
  return (
    <div class="space-y-2">
      {/* 市区町村（任意の絞り込み） */}
      <div class="relative">
        {selectedCity ? (
          <div
            class={`flex items-center gap-2 ${
              compact ? "px-2 py-1" : "px-3 py-2"
            } bg-gray-50 border border-gray-200 rounded-md text-sm`}
          >
            <span class="text-gray-600 flex-1">{selectedCity.name}</span>
            <button
              type="button"
              onClick={handleClearCity}
              class="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        ) : (
          <>
            <input
              ref={cityInputRef}
              type="text"
              value={cityQuery}
              onInput={(e: any) => setCityQuery(e.target.value)}
              onFocus={() => {
                if (cityResults.length > 0) setShowCityDropdown(true);
              }}
              onBlur={() =>
                setTimeout(() => setShowCityDropdown(false), 200)
              }
              placeholder="市区町村で絞り込み（任意）..."
              class={inputClass}
            />
            {citySearching && (
              <div class="absolute right-3 top-1/2 -translate-y-1/2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}

            {showCityDropdown && cityResults.length > 0 && (
              <ul class={dropdownClass}>
                {cityResults.map((city) => (
                  <li
                    key={city.slug}
                    onMouseDown={() => handleSelectCity(city)}
                    class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <span class="text-gray-800">
                      {city.都道府県}
                      {city.郡 ?? ""}
                      {city.市区町村}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {showCityDropdown &&
              !citySearching &&
              cityQuery.trim() !== "" &&
              cityResults.length === 0 && (
                <div
                  class={`absolute ${
                    compact ? "z-20" : "z-10"
                  } w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500`}
                >
                  該当する市区町村が見つかりませんでした
                </div>
              )}
          </>
        )}
      </div>

      {/* 神社名検索 */}
      <div class="relative">
        <input
          ref={shrineInputRef}
          type="text"
          value={shrineQuery}
          onInput={(e: any) => setShrineQuery(e.target.value)}
          onFocus={() => {
            if (shrineResults.length > 0) setShowShrineDropdown(true);
          }}
          onBlur={() =>
            setTimeout(() => setShowShrineDropdown(false), 200)
          }
          placeholder="神社名で検索..."
          class={inputClass}
        />
        {shrineSearching && (
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}

        {showShrineDropdown && shrineResults.length > 0 && (
          <ul class={dropdownClass}>
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
                  {shrine.住所 ? ` ${shrine.住所}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        {showShrineDropdown &&
          !shrineSearching &&
          shrineQuery.trim() !== "" &&
          shrineResults.length === 0 && (
            <div
              class={`absolute ${
                compact ? "z-20" : "z-10"
              } w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500`}
            >
              該当する神社が見つかりませんでした
            </div>
          )}
      </div>
    </div>
  );
}
