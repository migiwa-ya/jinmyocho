import { createRoute } from "honox/factory";

export default createRoute((c) => {
  const name = "神名帳 (β版)";

  return c.render(
    <>
      <title>{name}</title>

      <section class="prose prose-neutral mx-auto max-w-4xl px-4 py-10">
        <h1 class="text-3xl font-bold">{name}について</h1>
        <p class="mt-4">
          {name}
          は、日本各地の神社情報を学術・文化の視点で整理し、誰でも自由に検索・活用できるオープンアーカイブです。
        </p>
        <p class="mt-2">
          現在は整備途中のため不足や誤りが残っていますが、公開情報をもとに随時更新し、信頼性の向上に努めています。
        </p>
        <p class="mt-2">
          また、本プロジェクトを足掛かりに、民話などの民俗資料データ統合も行いたいと思っています。
        </p>

        <h2 class="mt-10 text-2xl font-semibold">プロジェクト概要</h2>
        <dl class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 mt-4">
          <dt class="font-medium">目的</dt>
          <dd>
            神社に関する基礎データを収集・整理し、研究・学習のハードルを下げる
          </dd>

          <dt class="font-medium">主な対象</dt>
          <dd>
            研究者・学生・学習者／民俗・歴史資料に関心のある一般利用者／文化データ活用を探る技術者
          </dd>

          <dt class="font-medium">運営形態</dt>
          <dd>個人運営（非営利・広告非掲載）</dd>

          <dt class="font-medium">データ出典</dt>
          <dd>公開情報を中心に収集整理＋コミュニティからの訂正・追加</dd>
        </dl>

        <h2 class="mt-10 text-2xl font-semibold">運営方針</h2>
        <ol class="list-decimal ml-6 space-y-2 mt-4">
          <li>
            <span class="font-medium">非営利・広告なし</span> —
            公平性・透明性・可用性・保存性を最優先します。
          </li>
          <li>
            <span class="font-medium">データの正確性重視</span> —
            誤情報は確認しだい修正し、履歴を公開します。
          </li>
          <li>
            <span class="font-medium">オープン参加型整備</span> — GitHub
            を活用し、データ訂正・追加提案を受け付けます。※リポジトリ公開および手順書は準備中です。
          </li>
          <li>
            <span class="font-medium">長期的な持続性</span> — 静的ファイル＋CDN
            で高い可用性を確保し、維持コストを抑えます。
          </li>
        </ol>

        <h2 class="mt-10 text-2xl font-semibold">参加方法（現行）</h2>
        <ul class="mt-4 space-y-2">
          <li class="flex flex-col sm:flex-row sm:items-start">
            <span class="font-medium shrink-0">
              GitHub Issue / PR による誤記報告
            </span>
            <span>各神社ページの「修正リクエスト（GitHub Issue）」から報告頂けます。※報告のみのため、反映は運営側で随時対応となります</span>
          </li>
          <li class="flex flex-col sm:flex-row sm:items-start">
            <span class="font-medium shrink-0">画像投稿</span>
            <span>ヘッダーのアカウントボタンを押下してから指示に従い、 GitHub アカウントの作成と、画像保存先の操作を可能にする処理（認可処理）を行ってください。</span>
            <span>そのあとマイページから画像が登録できるので、登録後、画像一覧からURLを取得して、上記「修正リクエスト」の「その他メモ」に追記してください。※反映は運営側で随時対応となります</span>
          </li>
        </ul>

        <h2 class="mt-10 text-2xl font-semibold">今後のロードマップ（概要）</h2>
        <div class="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-neutral-100">
              <tr>
                <th class="py-2 px-3 text-left font-semibold">フェーズ</th>
                <th class="py-2 px-3 text-left font-semibold">主な取り組み</th>
                <th class="py-2 px-3 text-left font-semibold">目標時期</th>
              </tr>
            </thead>
            <tbody>
              <tr class="even:bg-neutral-50">
                <td class="py-2 px-3 font-medium whitespace-nowrap">β安定化</td>
                <td class="py-2 px-3">
                  データ整合性チェック、誤記修正／重複整理
                </td>
                <td class="py-2 px-3">2025&nbsp;Q3</td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="py-2 px-3 font-medium whitespace-nowrap">機能拡張&nbsp;①</td>
                <td class="py-2 px-3">
                  地図 UI・タグ検索、GitHub 参加ガイド公開
                </td>
                <td class="py-2 px-3">2025&nbsp;Q4</td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="py-2 px-3 font-medium whitespace-nowrap">機能拡張&nbsp;②</td>
                <td class="py-2 px-3">外部 API（試験版）、MCP 対応の検討</td>
                <td class="py-2 px-3">2026&nbsp;上期</td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="py-2 px-3 font-medium whitespace-nowrap">統合フェーズ</td>
                <td class="py-2 px-3">民話・民俗資料データ統合</td>
                <td class="py-2 px-3">2026&nbsp;下期〜</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mt-10 text-2xl font-semibold">主な技術スタックと利用サービス</h2>
        <p class="mt-2 text-sm text-neutral-600">
          本プロジェクトは以下のクラウド基盤・OSS・データセットを利用しています。
        </p>
        <div class="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-neutral-100">
              <tr>
                <th class="px-4 py-2 text-left">カテゴリ</th>
                <th class="px-4 py-2 text-left">内容</th>
              </tr>
            </thead>
            <tbody>
              <tr class="even:bg-neutral-50">
                <td class="whitespace-nowrap px-4 py-3 font-medium">
                  クラウドサービス・ストレージ
                </td>
                <td class="px-4 py-3">Cloudflare Workers / R2 / CDN</td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="whitespace-nowrap px-4 py-3 font-medium">
                  フレームワーク
                </td>
                <td class="px-4 py-3">
                  <a
                    href="https://github.com/honojs/honox"
                    class="underline"
                    target="_blank"
                    rel="noopener"
                  >
                    Honox (Hono)
                  </a>
                </td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="whitespace-nowrap px-4 py-3 font-medium">
                  ライブラリ・外部サービス
                </td>
                <td class="px-4 py-3 space-y-1">
                  <div>
                    <a
                      href="https://maps.gsi.go.jp/development/siyou.html"
                      class="underline"
                      target="_blank"
                      rel="noopener"
                    >
                      地理院地図タイル
                    </a>
                  </div>
                  <div>
                    <a
                      href="https://leafletjs.com/"
                      class="underline"
                      target="_blank"
                      rel="noopener"
                    >
                      Leaflet.js
                    </a>
                  </div>
                  <div>
                    <a
                      href="https://github.com/migiwa-ya/staticql"
                      class="underline"
                      target="_blank"
                      rel="noopener"
                    >
                      StaticQL
                    </a>
                  </div>
                </td>
              </tr>
              <tr class="even:bg-neutral-50">
                <td class="whitespace-nowrap px-4 py-3 font-medium">
                  市区町村代表点データ
                </td>
                <td class="px-4 py-3">
                  <a
                    href="https://geoshape.ex.nii.ac.jp/city/"
                    class="underline"
                    target="_blank"
                    rel="noopener"
                  >
                    歴史的行政区域データセットβ版 (CODH, doi:10.20676/00000447)
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 class="mt-10 text-2xl font-semibold">免責事項</h2>
        <p class="mt-4">
          本サイトに掲載する情報はその内容を保証するものではありません。掲載情報の利用により生じたいかなる損害についても、運営者は一切の責任を負いかねますのでご了承ください。
        </p>

        <h2 class="mt-10 text-2xl font-semibold">ご協力のお願い</h2>
        <p class="mt-4">
          未来の研究者・学習者に向けた「知の共有地」を一緒に育てていきましょう。SNS
          でのシェアや、リポジトリ公開後の Star & Issue
          で応援していただけると幸いです。寄付や助成のご提案も歓迎しております！
        </p>

        <p class="mt-4">
          お問い合わせなどの際は下記へご連絡ください
          <a
            class="block text-right mt-2 text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            href="https://x.com/migiwa_ya_com"
          >
            x.com
          </a>
          <a
            class="block text-right mt-2 text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            href="https://bsky.app/profile/migiwa-ya.com"
          >
            bsky.app
          </a>
          <a
            class="block text-right mt-2 text-blue-600 hover:text-blue-800 underline"
            href="mailto:contact@migiwa-ya.com"
          >
            メール
          </a>
        </p>
      </section>
    </>
  );
});
