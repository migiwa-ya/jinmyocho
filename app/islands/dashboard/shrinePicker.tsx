import { useEffect, useRef, useState } from "hono/jsx";
import { loadStaticQL } from "../../staticql/client";
import {
  CitiesCustomIndexKeys,
  CitiesRecord,
  ShrinesCustomIndexKeys,
  ShrinesRecord,
} from "../../staticql/staticql-types";
import { ngram } from "../../utils/ngram";
import { encodeGeohash } from "../../utils/geohash";

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
  // Step 1: 市区町村検索
  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState<CitiesRecord[]>([]);
  const [citySearching, setCitySearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);

  // Step 2: 神社検索
  const [shrineQuery, setShrineQuery] = useState("");
  const [shrineResults, setShrineResults] = useState<ShrinesRecord[]>([]);
  const [shrineSearching, setShrineSearching] = useState(false);
  const [showShrineDropdown, setShowShrineDropdown] = useState(false);
  const [shrineLoaded, setShrineLoaded] = useState(false);

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

  // 市区町村選択後に神社一覧を取得
  useEffect(() => {
    if (!selectedCity) {
      setShrineResults([]);
      setShrineLoaded(false);
      return;
    }

    (async () => {
      setShrineSearching(true);
      setShrineLoaded(false);
      try {
        const staticql = await loadStaticQL();
        // geohash の先頭部分で地域を絞り込む（precision 4 ≒ 市区町村レベル）
        const prefix = selectedCity.geohash.slice(0, 4);
        const res = await staticql
          .from<ShrinesRecord, ShrinesCustomIndexKeys>("shrines")
          .where("geohash", "startsWith", prefix)
          .exec();

        setShrineResults(res.data);
        setShrineLoaded(true);
        setShowShrineDropdown(true);
      } catch (error) {
        console.error("神社一覧の取得に失敗しました:", error);
      } finally {
        setShrineSearching(false);
      }
    })();
  }, [selectedCity]);

  // 神社名でローカルフィルタした結果
  const filteredShrines = shrineQuery.trim()
    ? shrineResults.filter((s) => s.名称.includes(shrineQuery.trim()))
    : shrineResults;

  const handleSelectCity = (city: CitiesRecord) => {
    setSelectedCity({
      name: city.都道府県 + (city.郡 ?? "") + city.市区町村,
      geohash: city.geohash,
    });
    setCityQuery("");
    setCityResults([]);
    setShowCityDropdown(false);
    setShrineQuery("");
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

  const handleBackToCity = () => {
    setSelectedCity(null);
    setShrineQuery("");
    setShrineResults([]);
    setShrineLoaded(false);
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

  // Step 2: 市区町村選択済み → 神社選択
  if (selectedCity) {
    return (
      <div class="space-y-1">
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={handleBackToCity}
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {selectedCity.name}
          </button>
          <span>の神社を選択</span>
        </div>
        <div class="relative">
          <input
            ref={shrineInputRef}
            type="text"
            value={shrineQuery}
            onInput={(e: any) => {
              setShrineQuery(e.target.value);
              setShowShrineDropdown(true);
            }}
            onFocus={() => setShowShrineDropdown(true)}
            onBlur={() => setTimeout(() => setShowShrineDropdown(false), 200)}
            placeholder="神社名で絞り込み..."
            class={inputClass}
          />
          {shrineSearching && (
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}

          {showShrineDropdown && shrineLoaded && (
            <ul class={dropdownClass}>
              {filteredShrines.length === 0 ? (
                <li class="px-3 py-2 text-sm text-gray-500">
                  該当する神社が見つかりませんでした
                </li>
              ) : (
                filteredShrines.map((shrine) => (
                  <li
                    key={shrine.slug}
                    onMouseDown={() => handleSelectShrine(shrine)}
                    class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <span class="font-medium text-gray-800">
                      {shrine.名称}
                    </span>
                    {shrine.住所 && (
                      <span class="ml-2 text-gray-500 text-xs">
                        {shrine.住所}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Step 1: 市区町村検索
  return (
    <div class="relative">
      <input
        ref={cityInputRef}
        type="text"
        value={cityQuery}
        onInput={(e: any) => setCityQuery(e.target.value)}
        onFocus={() => {
          if (cityResults.length > 0) setShowCityDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
        placeholder="市区町村名で検索..."
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
    </div>
  );
}
