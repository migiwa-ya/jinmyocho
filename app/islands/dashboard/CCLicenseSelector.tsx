import { Event, FC, RefObject, useRef, useState } from "hono/jsx";

type LicenseKey =
  | ""
  | "CC0-1.0"
  | "CC-BY-4.0"
  | "CC-BY-SA-4.0"
  | "CC-BY-ND-4.0"
  | "CC-BY-NC-4.0"
  | "CC-BY-NC-SA-4.0"
  | "CC-BY-NC-ND-4.0";

interface LicenseOption {
  value: LicenseKey;
  label: string;
  description: string;
  link: string;
}

const licenseOptions: LicenseOption[] = [
  {
    value: "CC0-1.0",
    label: "CC0 1.0 ユニバーサル (CC0 1.0 Universal)",
    description:
      "CC0 1.0 Universal: 著作権を放棄し、パブリックドメイン相当として扱います。",
    link: "https://creativecommons.org/publicdomain/zero/1.0/deed.ja",
  },
  {
    value: "CC-BY-4.0",
    label: "CC BY 4.0 国際 (Attribution 4.0 International)",
    description: "表示（帰属）を条件に再利用可能です。",
    link: "https://creativecommons.org/licenses/by/4.0/deed.ja",
  },
  {
    value: "CC-BY-SA-4.0",
    label: "CC BY-SA 4.0 国際 (Attribution-ShareAlike 4.0 International)",
    description: "表示および同一ライセンスでの共有を条件に再利用可能です。",
    link: "https://creativecommons.org/licenses/by-sa/4.0/deed.ja",
  },
  {
    value: "CC-BY-ND-4.0",
    label: "CC BY-ND 4.0 国際 (Attribution-NoDerivatives 4.0 International)",
    description: "表示を条件に再配布可能ですが、改変は禁止です。",
    link: "https://creativecommons.org/licenses/by-nd/4.0/deed.ja",
  },
  {
    value: "CC-BY-NC-4.0",
    label: "CC BY-NC 4.0 国際 (Attribution-NonCommercial 4.0 International)",
    description: "表示および非営利利用を条件に再利用可能です。",
    link: "https://creativecommons.org/licenses/by-nc/4.0/deed.ja",
  },
  {
    value: "CC-BY-NC-SA-4.0",
    label:
      "CC BY-NC-SA 4.0 国際 (Attribution-NonCommercial-ShareAlike 4.0 International)",
    description: "表示・非営利・同一ライセンスでの共有を条件に再利用可能です。",
    link: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja",
  },
  {
    value: "CC-BY-NC-ND-4.0",
    label:
      "CC BY-NC-ND 4.0 国際 (Attribution-NonCommercial-NoDerivatives 4.0 International)",
    description: "表示・非営利利用のみ許可、改変は禁止です。",
    link: "https://creativecommons.org/licenses/by-nc-nd/4.0/deed.ja",
  },
];

interface CCLicenseSelectorProps {
  /** フォーム送信時に使う name 属性 */
  name?: string;
  /** 初期選択値（value） */
  defaultValue?: LicenseKey;
  /** 選択が変わったときに呼ばれるハンドラ */
  onChange?: (value: LicenseKey) => void;
  selectRef: RefObject<HTMLInputElement>;
}

/**
 * Creative Commons ライセンス選択用コンポーネント
 */
export const CCLicenseSelector: FC<CCLicenseSelectorProps> = ({
  name = "cc_license",
  defaultValue = "CC-BY-NC-ND-4.0",
  onChange,
  selectRef,
}) => {
  const [selected, setSelected] = useState<LicenseKey>(defaultValue);

  const handleChange = (e: Event) => {
    e.preventDefault();
    const val = selectRef.current?.value as LicenseKey;
    setSelected(val);
    if (onChange) {
      onChange(val);
    }
  };

  // 選択中のオプションの詳細を取得
  const selectedOption = licenseOptions.find((opt) => opt.value === selected);

  return (
    <>
      <select
        id="cc-license-select"
        name={name}
        onChange={(e) => handleChange(e)}
        value={selected}
        ref={selectRef}
        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {licenseOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            selected={opt.value === selected}
          >
            {opt.label}
          </option>
        ))}
      </select>

      {selectedOption && selectedOption.value && (
        <div class="mt-3 text-xs leading-3">
          <p>{selectedOption.description}</p>
          <p>
            詳細:{" "}
            <a
              class="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
              href={selectedOption.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {selectedOption.link}
            </a>
          </p>
        </div>
      )}
    </>
  );
};
