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
          <dd>個人運営（非営利・広告非掲載） — 将来的に一般社団法人化を検討</dd>

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

        <h2 class="mt-10 text-2xl font-semibold">参加方法（準備中）</h2>
        <ul class="mt-4 space-y-2">
          <li class="flex flex-col sm:flex-row sm:items-start">
            <span class="font-medium w-48 shrink-0">誤記報告フォーム</span>
            <span>2025 Q3 公開予定</span>
          </li>
          <li class="flex flex-col sm:flex-row sm:items-start">
            <span class="font-medium w-48 shrink-0">GitHub Issue / PR</span>
            <span>2025 Q3 公開予定</span>
          </li>
        </ul>

        <h2 class="mt-10 text-2xl font-semibold">今後のロードマップ（概要）</h2>
        <div class="overflow-x-auto mt-4">
          <table class="min-w-full text-sm border-collapse">
            <thead>
              <tr class="border-b">
                <th class="py-2 px-3 text-left font-semibold">フェーズ</th>
                <th class="py-2 px-3 text-left font-semibold">主な取り組み</th>
                <th class="py-2 px-3 text-left font-semibold">目標時期</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b">
                <td class="py-2 px-3 font-medium">β安定化</td>
                <td class="py-2 px-3">
                  データ整合性チェック、誤記修正／重複整理
                </td>
                <td class="py-2 px-3">2025&nbsp;Q3</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-3 font-medium">機能拡張&nbsp;①</td>
                <td class="py-2 px-3">
                  地図 UI・タグ検索、GitHub 参加ガイド公開
                </td>
                <td class="py-2 px-3">2025&nbsp;Q4</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-3 font-medium">機能拡張&nbsp;②</td>
                <td class="py-2 px-3">外部 API（試験版）、MCP 対応の検討</td>
                <td class="py-2 px-3">2026&nbsp;上期</td>
              </tr>
              <tr>
                <td class="py-2 px-3 font-medium">統合フェーズ</td>
                <td class="py-2 px-3">民話・民俗資料データ統合</td>
                <td class="py-2 px-3">2026&nbsp;下期〜</td>
              </tr>
            </tbody>
          </table>
        </div>

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
