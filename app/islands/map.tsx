import { useEffect, useState, useRef } from "hono/jsx";
import { loadStaticQL } from "../staticql/client";
import { encodeGeohash } from "../utils/geohash";
import {
  ShrinesCustomIndexKeys,
  ShrinesRecord,
} from "../staticql/staticql-types";
import CheckGpsInterceptor from "./checkGpsInterceptor";

export interface MapProps {
  lat?: number;
  lng?: number;
  zoom?: number;
}

const hiddenZoomLevel = 10;

export default function Map({ lat, lng, zoom = 15 }: MapProps) {
  const [shrines, setShrines] = useState<ShrinesRecord[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [viewKey, setViewKey] = useState(0);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ marker: any; slug: string }[]>([]);
  const fetchedPrefixesRef = useRef<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [festivalFilter, setFestivalFilter] = useState<
    "none" | "all" | "today" | number
  >("none");
  const [filterTab, setFilterTab] = useState<"festival" | "deity">("festival");
  const [deityFilter, setDeityFilter] = useState<"all" | string>("all");
  const [loading, setLoading] = useState(false);

  function getPrecision(level: number): number {
    if (level <= 13) return 4;
    if (level <= 15) return 5;
    if (level <= 17) return 6;
    return 7;
  }

  async function updateData(): Promise<void> {
    if (!mapRef.current || !fetchedPrefixesRef.current) return;

    const map = mapRef.current;
    if (map.getZoom() <= hiddenZoomLevel) {
      return;
    }

    const precision = getPrecision(map.getZoom());
    const center = map.getCenter();
    const prefix = encodeGeohash(center.lat, center.lng, precision);

    const skip = Array.from(fetchedPrefixesRef.current).some(
      (f) => f.startsWith(prefix) || prefix.startsWith(f)
    );
    if (skip) return;

    setLoading(true);
    try {
      // await new Promise(resolve => setTimeout(resolve, 5000));
      const staticql = await loadStaticQL();
      const res = await staticql
        .from<ShrinesRecord, ShrinesCustomIndexKeys>("shrines")
        .where("geohash", "startsWith", prefix)
        .exec();
      if (res) {
        setShrines((prev) => {
          const seen = new Set(prev.map((s) => s.slug));
          const extra = res.data.filter((s) => !seen.has(s.slug));
          return prev.concat(extra);
        });
        fetchedPrefixesRef.current.add(prefix);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const L = (globalThis as any).L as typeof import("leaflet");
      const map = L.map("map", { scrollWheelZoom: true }).setView(
        [lat ?? 35.6895, lng ?? 139.6917],
        zoom
      );
      L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
        attribution:
          '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">国土地理院</a>',
      }).addTo(map);
      map.scrollWheelZoom.enable();
      mapRef.current = map;
      map.on("moveend zoomend", () => {
        updateData();
        const z = map.getZoom();

        if (!markersRef.current) return;
        markersRef.current.forEach(({ marker }) => {
          const el = marker.getElement();
          const shadow = (marker as any)._shadow;
          const popupContainer = (marker as any)._popup?._container;
          if (el) el.style.display = z <= hiddenZoomLevel ? "none" : "";
          if (shadow) shadow.style.display = z <= hiddenZoomLevel ? "none" : "";
          if (popupContainer)
            popupContainer.style.display = z <= hiddenZoomLevel ? "none" : "";
        });
        setViewKey((v) => v + 1);
      });
      // 移動開始時にポップアップを閉じ、選択状態をクリア
      map.on("movestart", () => {
        map.closePopup();
        setSelectedSlug(null);
      });
      // 現在地取得後に地図中心を即時移動
      map.on("locationfound", (e) => {
        map.setView(e.latlng, map.getZoom(), { animate: false });
      });
      map.on("locationerror", () => {
        alert("位置情報を取得できませんでした");
      });
      // 現在地取得後に地図中心を移動
      updateData();
    })();
  }, [lat, lng, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    (async () => {
      const L = (globalThis as any).L as typeof import("leaflet");

      if (!markersRef.current) return;
      markersRef.current.forEach(({ marker }) =>
        mapRef.current.removeLayer(marker)
      );
      markersRef.current = [];
      shrines.forEach((s) => {
        const sLat = Number(s.緯度);
        const sLng = Number(s.経度);
        if (!isNaN(sLat) && !isNaN(sLng)) {
          const m = L.marker([sLat, sLng]).addTo(mapRef.current);
          const popupContent = `<div>
            <strong>${s.名称}</strong><br/>
            ${s.住所 || ""}<br/>
            <a href="/s/${
              s.slug
            }" class="text-blue-600 underline text-lg">詳細を見る</a>
          </div>`;
          m.bindPopup(popupContent, { closeButton: false, autoClose: false });
          m.on("click", () => {
            const map = mapRef.current;
            if (!map) return;
            map.setView([sLat, sLng], map.getZoom(), { animate: false });
            setSelectedSlug(s.slug);
          });
          markersRef.current!.push({ marker: m, slug: s.slug });
        }
      });
    })();
  }, [shrines]);

  useEffect(() => {
    if (festivalFilter === "none") return;

    setListOpen(true);
  }, [festivalFilter]);
  useEffect(() => {
    if (deityFilter === "all") return;

    setListOpen(true);
  }, [deityFilter]);

  function selectShrine(slug: string) {
    if (!markersRef.current) return;
    const item = markersRef.current.find((m) => m.slug === slug);
    if (!item) return;
    const { marker } = item;
    const { lat, lng } = marker.getLatLng();
    const map = mapRef.current;
    if (map) map.setView([lat, lng], map.getZoom(), { animate: false });
    setSelectedSlug(slug);
  }

  // 現在のズームレベル
  const currentZoom = mapRef.current?.getZoom() ?? zoom;
  // 表示範囲内の神社リスト（ズームレベルに応じて非表示）
  const visibleShrines =
    currentZoom > hiddenZoomLevel && mapRef.current
      ? shrines.filter((s) => {
          const sLat = Number(s.緯度);
          const sLng = Number(s.経度);
          return (
            !isNaN(sLat) &&
            !isNaN(sLng) &&
            mapRef.current.getBounds().contains({ lat: sLat, lng: sLng })
          );
        })
      : [];
  visibleShrines.sort((a, b) => a.名称.localeCompare(b.名称));
  // 各月フィルタ用：visibleShrines から集計した祭事の開祭月リスト
  const festivalMonths = Array.from(
    new Set(
      visibleShrines.flatMap((s) =>
        (s.祭事 ?? []).flatMap((f) => {
          if (f.開催月) return [f.開催月];
          if (f.開催月日) {
            const parsed = parseInt((f.開催月日 as string).split("-")[0], 10);
            return isNaN(parsed) ? [] : [parsed];
          }
          return [];
        })
      )
    )
  ).sort((a, b) => a - b);

  // 各神社の祭神名リスト
  const deityNames = Array.from(
    new Set(visibleShrines.flatMap((s) => (s.祭神 ?? []).map((d) => d.名称)))
  ).sort((a, b) => a.localeCompare(b));

  // フィルタ種別に応じて神社を絞り込む
  const filteredShrines = visibleShrines.filter((s) => {
    if (filterTab === "festival") {
      if (typeof festivalFilter === "number") {
        const month = festivalFilter;
        if (
          !(s.祭事 ?? []).some((f) => {
            if (f.開催月 === month) return true;
            if (f.開催月日) {
              const m = parseInt((f.開催月日 as string).split("-")[0], 10);
              return !isNaN(m) && m === month;
            }
            return false;
          })
        ) {
          return false;
        }
      }
    } else {
      if (deityFilter !== "all") {
        if (!(s.祭神 ?? []).some((d) => d.名称 === deityFilter)) {
          return false;
        }
      }
    }
    return true;
  });

  // 選択・フィルタ対象のマーカーを強調表示（selected: 緑, filtered: 赤）
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    const z = mapRef.current.getZoom();
    markersRef.current.forEach(({ marker, slug }) => {
      const el = marker.getElement();
      if (!el) return;
      const isFiltered =
        filterTab === "festival"
          ? festivalFilter !== "all" &&
            festivalFilter !== "none" &&
            filteredShrines.some((fs) => fs.slug === slug)
          : filterTab === "deity" &&
            deityFilter !== "all" &&
            filteredShrines.some((fs) => fs.slug === slug);

      if (slug === selectedSlug && z > hiddenZoomLevel) {
        el.style.filter = "hue-rotate(120deg)";
        marker.openPopup();
      } else {
        marker.closePopup();
        if (isFiltered && z > hiddenZoomLevel) {
          el.style.filter = "hue-rotate(150deg)";
        } else {
          el.style.filter = "";
        }
      }
    });
  }, [selectedSlug, viewKey, festivalFilter, filterTab, deityFilter]);

  return (
    <>
      <div
        id="map"
        class="fixed w-full h-[calc(100vh-120px)] overscroll-contain"
      />
      <CheckGpsInterceptor>
        {(intercept) => (
          <button
            onClick={intercept((e) => {
              const map = mapRef.current;
              if (map) {
                map.locate({
                  setView: false,
                  enableHighAccuracy: false,
                  maximumAge: 300000,
                  timeout: 10000,
                });
              }
            })}
            class="absolute bottom-[25vw] right-4 z-20 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </CheckGpsInterceptor>

      {currentZoom > hiddenZoomLevel && (
        <div class="z-20 fixed bottom-0 left-0 w-full bg-white bg-opacity-80">
          <div class="relative flex justify-center items-center shadow-lg">
            <button
              class="flex items-center gap-2 h-[60px] font-bold text-center text-gray-800"
              onClick={() => setListOpen((o) => !o)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path d="M3 4.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM6.25 3a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 7.25a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM6.25 11.5a.75.75 0 0 0 0 1.5h7a.75.75 0 0 0 0-1.5h-7ZM4 12.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM3 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
              {loading ? "Loading..." : "表示されている神社"}
            </button>
            <button
              onClick={() => setFilterOpen((o) => !o)}
              class="absolute right-2 border border-gray-300 p-2 rounded inset-shadow-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path
                  fillRule="evenodd"
                  d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {listOpen && (
            <ul class="max-h-64 overflow-y-auto space-y-2 p-2">
              {filteredShrines.map((s) => (
                <li
                  key={s.slug}
                  class="p-4 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-between"
                  onClick={() => selectShrine(s.slug)}
                >
                  <div class="font-medium text-gray-800">{s.名称}</div>
                  <div class="flex-1 ml-2 text-sm text-gray-600 text-right line-clamp-1">
                    {s.住所}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {filterOpen && (
        <div class="z-30 fixed inset-0 flex items-center justify-center bg-black/50">
          <div class="bg-white p-4 rounded shadow-lg w-9/12">
            <div class="flex border-b mb-4">
              <button
                class={`px-4 py-2 -mb-px ${
                  filterTab === "festival"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : ""
                }`}
                onClick={() => setFilterTab("festival")}
              >
                祭事
              </button>
              <button
                class={`px-4 py-2 -mb-px ${
                  filterTab === "deity"
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : ""
                }`}
                onClick={() => setFilterTab("deity")}
              >
                祭神
              </button>
            </div>
            {filterTab === "festival" ? (
              <div class="flex flex-wrap space-x-2 mb-4 max-h-[50vh] overflow-y-scroll content-start">
                {festivalMonths.map((m) => (
                  <button
                    key={m}
                    class={`px-3 py-1 rounded ${
                      festivalFilter === m ? "bg-blue-500 text-white" : ""
                    }`}
                    onClick={() => {
                      setFestivalFilter(m);
                      setFilterOpen(false);
                    }}
                  >
                    {m}月
                  </button>
                ))}
              </div>
            ) : (
              <div class="flex flex-wrap space-x-2 mb-4 max-h-[50vh] overflow-y-scroll content-start">
                {deityNames.map((name) => (
                  <button
                    key={name}
                    class={`px-3 py-1 rounded ${
                      deityFilter === name ? "bg-blue-500 text-white" : ""
                    }`}
                    onClick={() => {
                      setDeityFilter(name);
                      setFilterOpen(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <div class="flex justify-end space-x-2">
              <button
                class="px-3 py-1 border rounded"
                onClick={() => {
                  setDeityFilter("all");
                  setFestivalFilter("all");
                  setFilterOpen(false);
                }}
              >
                リセット
              </button>
              <button
                class="px-3 py-1 border rounded"
                onClick={() => setFilterOpen(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
