import { FC, Fragment, useEffect, useRef, useState } from "hono/jsx";
import { handleEnter } from "../utils/handler";
// import CheckGpsInterceptor from "./checkGpsInterceptor";
import { loadStaticQL } from "../staticql/client";
import {
  CitiesCustomIndexKeys,
  CitiesRecord,
} from "../staticql/staticql-types";
import { ngram } from "../utils/ngram";

type Suggest = {
  url: string;
  name: string;
};

const SearchBox: FC = () => {
  const [suggest, setSuggest] = useState<Suggest[]>([]);
  const [keyword, setKeyword] = useState("");
  const [suggestResult, setSuggestResult] = useState<Suggest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [hasMoreSuggest, setHasMoreSuggest] = useState(false);

  const [translateY, setTranslateY] = useState(0);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = () => {
    const keywordData = searchInputRef.current?.value;
    if (!keywordData) return;

    setKeyword(keywordData);
    setIsOverlayVisible(true);
    setIsOverlayOpen(true);
    setIsModalOpen(true);
    setTimeout(() => setIsListVisible(true), 200);
  };

  const handleCloseModal = () => {
    setIsListVisible(false);
    setTimeout(() => setIsOverlayVisible(false), 400);
    setTimeout(() => setIsOverlayOpen(false), 500);
    setTimeout(() => setIsModalOpen(false), 200);
  };

  useEffect(() => {
    // GPSのステータス確認
    const check = async () => {
      const { state } = await navigator.permissions.query({
        name: "geolocation",
      });
      console.log(state);
    };
    check();

    // 検索ボックスのモーダル表示位置設定
    if (searchBoxRef.current) {
      setTranslateY(0);
    }
  }, []);

  useEffect(() => {
    if (keyword) {
      const loadData = async () => {
        setLoadingSuggest(true);
        try {
          const keys = ngram(keyword, 2);
          const staticql = await loadStaticQL();
          let query = await staticql
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

          const cities = await query.exec();
          setSuggestResult(
            cities.data.map((c) => ({
              url: `/s?g=${c.geohash}`,
              name: c.都道府県 + (c.郡 ?? "") + c.市区町村,
            }))
          );
          setHasMoreSuggest(!!cities.pageInfo.hasNextPage);
        } catch (error) {
          console.error("データの読み込みに失敗しました:", error);
        } finally {
          setLoadingSuggest(false);
        }
      };

      loadData();
    } else {
      setSuggestResult([]);
      setHasMoreSuggest(false);
      setLoadingSuggest(false);
    }
  }, [keyword, suggest]);

  return (
    <div className="flex justify-center">
      {/* モーダルの背景 */}
      {isOverlayOpen && (
        <div
          className={`fixed inset-0 bg-white z-10
            ${isOverlayVisible ? "opacity-100" : "opacity-0"}
            `}
          onClick={handleCloseModal}
        ></div>
      )}

      {/* 検索ボックス */}
      <div
        ref={searchBoxRef}
        className={`w-full p-2 z-30 bg-white ${
          isModalOpen ? "fixed shadow-lg" : ""
        }`}
        style={{
          transform: isModalOpen
            ? `translateY(${translateY}px)`
            : "translateY(0)",
        }}
      >
        <div className="flex justify-between items-center gap-2">
          <a
            href="/"
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </a>

          <div class="relative w-full">
            <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                class="w-4 h-4 text-gray-500 dark:text-gray-400 size-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              onSubmit={handleOpenModal}
              onKeyDown={handleEnter(() => handleOpenModal())}
              type="text"
              placeholder="神社名、市区町村名"
              className="w-full p-3 pl-9 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* <button
            onClick={handleOpenModal}
            className=" bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button> */}
        </div>
      </div>

      {/* モーダル（サジェストリスト） */}
      {isModalOpen && (
        <div
          ref={searchBoxRef}
          className={`w-full p-4 z-20 pb-20 ${
            isListVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: isModalOpen
              ? `translateY(${translateY + 60}px)`
              : "translateY(0)",
          }}
        >
          <ul className="space-y-2">
            <li>
              <a
                href={`/s?sn=${keyword}`}
                className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-between"
              >
                <span>神社名検索: {keyword}</span>⛩
              </a>
            </li>
            {loadingSuggest ? (
              <li className="text-center text-gray-500">Loading...</li>
            ) : (
              <>
                {suggestResult.length === 0 ? (
                  <li className="text-center text-gray-500">
                    該当する市区町村は見つかりませんでした
                  </li>
                ) : (
                  suggestResult.map((item) => (
                    <Fragment key={item.url}>
                      <li>
                        <a
                          href={item.url}
                          className="p-4 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center justify-between"
                        >
                          <span>{item.name}</span>
                          🗺
                        </a>
                      </li>
                    </Fragment>
                  ))
                )}
                {hasMoreSuggest && (
                  <li className="text-center text-gray-500">
                    検索結果が多いため表示が省略されました
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}

      {/* 閉じるボタン */}
      {isModalOpen && (
        <button
          onClick={handleCloseModal}
          className="fixed bottom-5 right-5 w-10 h-10 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 z-30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 justify-self-center"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBox;
